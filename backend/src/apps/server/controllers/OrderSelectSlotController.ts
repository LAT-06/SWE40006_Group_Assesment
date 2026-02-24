import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class OrderSelectSlotController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { delivery_slot_id, notes } = req.body;
      const user = req.user;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing order ID" });
        return;
      }

      const client = SupabaseClientFactory.createServiceRoleClient();

      // Verify ownership and pending status
      const { data: order, error: fetchError } = await client
        .from("orders")
        .select("id, status, user_id")
        .eq("id", id)
        .single();

      if (fetchError || !order) {
        res.status(httpStatus.NOT_FOUND).json({ error: "Order not found" });
        return;
      }

      if (order.user_id !== user.id) {
        res.status(httpStatus.FORBIDDEN).json({ error: "Access denied" });
        return;
      }

      if (order.status !== "pending") {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Cannot update order with status: ${order.status}` });
        return;
      }

      // Verify the slot exists and is open — atomically claim it
      if (delivery_slot_id) {
        const { data: claimed, error: claimError } = await client
          .rpc("claim_delivery_slot", { p_slot_id: delivery_slot_id });

        if (claimError) {
          res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: claimError.message });
          return;
        }

        if (!claimed) {
          res.status(httpStatus.CONFLICT).json({ error: "This delivery slot is full or closed" });
          return;
        }
      }

      const updates: Record<string, any> = {};
      if (delivery_slot_id !== undefined)
        updates.delivery_slot_id = delivery_slot_id;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await client
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select(
          "*, delivery_slot:delivery_slots(id, slot_date, start_time, end_time, delivery_zones(name))",
        )
        .single();

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

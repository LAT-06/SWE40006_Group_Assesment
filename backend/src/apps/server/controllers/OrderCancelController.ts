import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class OrderCancelController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing order ID" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      // Verify the order belongs to the user and is still pending
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
          .json({ error: `Cannot cancel order with status: ${order.status}` });
        return;
      }

      const { data, error } = await client
        .from("orders")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id)
        .select()
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

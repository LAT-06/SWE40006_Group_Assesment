import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliverySlotDeleteController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing slot ID" });
        return;
      }

      const client = SupabaseClientFactory.createClient();

      // Check no orders are assigned to this slot
      const { count } = await client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("delivery_slot_id", id);

      if (count && count > 0) {
        res
          .status(httpStatus.CONFLICT)
          .json({
            error: `Cannot delete: ${count} order(s) are assigned to this slot`,
          });
        return;
      }

      const { error } = await client
        .from("delivery_slots")
        .delete()
        .eq("id", id);
      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

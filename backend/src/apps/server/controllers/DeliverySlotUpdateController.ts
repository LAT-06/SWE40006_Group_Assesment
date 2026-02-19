import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliverySlotUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { capacity, status, zone_id, slot_date, start_time, end_time } =
        req.body;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing slot ID" });
        return;
      }

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (capacity !== undefined) updates.capacity = capacity;
      if (status !== undefined) updates.status = status;
      if (zone_id !== undefined) updates.zone_id = zone_id;
      if (slot_date !== undefined) updates.slot_date = slot_date;
      if (start_time !== undefined) updates.start_time = start_time;
      if (end_time !== undefined) updates.end_time = end_time;

      const client = SupabaseClientFactory.createClient();
      const { data, error } = await client
        .from("delivery_slots")
        .update(updates)
        .eq("id", id)
        .select("*, delivery_zones(id, name)")
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

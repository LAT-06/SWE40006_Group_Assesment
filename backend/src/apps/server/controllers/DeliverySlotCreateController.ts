import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliverySlotCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { zone_id, slot_date, start_time, end_time, capacity, status } =
        req.body;

      if (!slot_date || !start_time || !end_time) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "slot_date, start_time, and end_time are required" });
        return;
      }

      const client = SupabaseClientFactory.createClient();
      const insertPayload: any = {
        zone_id: zone_id || null,
        slot_date,
        start_time,
        end_time,
        capacity: capacity ?? 20,
      };
      if (status) insertPayload.status = status;

      const { data, error } = await client
        .from("delivery_slots")
        .insert(insertPayload)
        .select("*, delivery_zones(id, name)")
        .single();

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.CREATED).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliverySlotListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const client = SupabaseClientFactory.createClient();
      const { date, zone_id } = req.query;

      let query = client
        .from("delivery_slots")
        .select("*, delivery_zones(id, name)")
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (date) query = query.eq("slot_date", date as string);
      if (zone_id) query = query.eq("zone_id", zone_id as string);

      const { data, error } = await query;

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

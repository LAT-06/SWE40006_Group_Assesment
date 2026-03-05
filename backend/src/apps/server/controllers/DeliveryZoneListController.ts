import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliveryZoneListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const client = SupabaseClientFactory.createClient();
      const { data, error } = await client
        .from("delivery_zones")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

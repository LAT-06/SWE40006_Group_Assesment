import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliveryZoneCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, is_active, suburbs } = req.body;

      if (!name) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "name is required" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("delivery_zones")
        .insert({
          name,
          description: description ?? null,
          is_active: is_active ?? true,
          suburbs: suburbs ?? [],
        })
        .select()
        .single();

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.CREATED).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

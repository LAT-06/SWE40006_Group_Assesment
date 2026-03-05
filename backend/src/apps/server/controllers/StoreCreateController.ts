import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class StoreCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, phone, email, opening_hours, is_active } = req.body;

      if (!name || !address) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "name and address are required" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("stores")
        .insert({ name, address, phone: phone ?? null, email: email ?? null, opening_hours: opening_hours ?? null, is_active: is_active ?? true })
        .select()
        .single();

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.CREATED).json({ data });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

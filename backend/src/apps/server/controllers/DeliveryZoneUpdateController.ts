import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliveryZoneUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, description, is_active, suburbs } = req.body;

      const updates: Record<string, any> = {};
      if (name !== undefined)        updates.name = name;
      if (description !== undefined) updates.description = description;
      if (is_active !== undefined)   updates.is_active = is_active;
      if (suburbs !== undefined)     updates.suburbs = suburbs;

      if (Object.keys(updates).length === 0) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "No fields to update" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("delivery_zones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

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

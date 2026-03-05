import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class StoreUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, address, phone, email, opening_hours, is_active } = req.body;

      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;
      if (opening_hours !== undefined) updates.opening_hours = opening_hours;
      if (is_active !== undefined) updates.is_active = is_active;

      if (Object.keys(updates).length === 0) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "No fields to update" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("stores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json({ data });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

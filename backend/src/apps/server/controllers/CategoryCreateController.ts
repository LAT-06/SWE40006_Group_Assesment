import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CategoryCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug, description, icon } = req.body;
      if (!name || !slug) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing name or slug" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("categories")
        .insert({ name, slug, description, icon })
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

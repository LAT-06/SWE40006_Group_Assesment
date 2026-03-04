import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CategoryUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updates = req.body;
      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("categories")
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

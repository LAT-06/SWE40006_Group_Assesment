import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CategoryGetController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const client = SupabaseClientFactory.createClient();
      const { data, error } = await client
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        res.status(httpStatus.NOT_FOUND).json({ error: "Category not found" });
        return;
      }
      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

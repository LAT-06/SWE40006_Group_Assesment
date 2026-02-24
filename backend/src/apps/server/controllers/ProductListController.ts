import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const client = SupabaseClientFactory.createClient();

      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await client
        .from("products")
        .select(`*, category:categories(name, slug)`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json({ data, total: count ?? 0, page, limit });
    } catch (err: any) {
      console.error("Controller error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

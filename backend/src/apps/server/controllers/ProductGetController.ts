import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductGetController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing product ID" });
        return;
      }

      const client = SupabaseClientFactory.createClient();

      const { data, error } = await client
        .from("products")
        .select(`
          *,
          category:categories(name, slug)
        `)
        .eq("id", id)
        .single();

      if (error) {
        // Check for specific "not found" error from PostgREST if needed, 
        // usually it returns code 'PGRST116' or data is null
        console.error("Get Product Error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({ error: "Product not found" });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      console.error("Controller Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

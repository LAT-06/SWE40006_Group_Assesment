import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Missing product ID" });
        return;
      }

      // Use service role client to bypass RLS for admin operations
      const client = SupabaseClientFactory.createClient();

      const { data, error } = await client
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update Product Error:", error);
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
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

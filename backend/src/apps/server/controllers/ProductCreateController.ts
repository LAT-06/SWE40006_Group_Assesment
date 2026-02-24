import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        slug,
        price,
        category_id,
        brand,
        weight,
        image_url,
        description,
        nutrition,
        storage,
        in_stock,
        badge,
        original_price,
        dietary_tags,
      } = req.body;

      // Basic validation
      if (!name || !price || !slug) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Missing required fields (name, price, slug)" });
        return;
      }

      // Use service role client to bypass RLS for admin operations
      // Admin middleware has already verified the user is an admin
      const client = SupabaseClientFactory.createClient();

      const { data, error } = await client
        .from("products")
        .insert({
          name,
          slug,
          price,
          category_id,
          brand,
          weight,
          image_url,
          description,
          nutrition: nutrition ?? [],
          storage,
          in_stock: in_stock ?? true,
          badge,
          original_price,
          dietary_tags,
        })
        .select()
        .single();

      if (error) {
        console.error("Create Product Error:", error);
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.CREATED).json(data);
    } catch (err: any) {
      console.error("Controller Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class StockUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, in_stock } = req.body;

      if (!id) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Missing product ID" });
        return;
      }

      const updates: Record<string, any> = {};
      if (quantity !== undefined) updates.quantity = quantity;
      if (in_stock !== undefined) updates.in_stock = in_stock;

      if (Object.keys(updates).length === 0) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "No fields to update" });
        return;
      }

      const client = SupabaseClientFactory.createClient();
      const { data, error } = await client
        .from("products")
        .update(updates)
        .eq("id", id)
        .select("id, name, quantity, in_stock")
        .single();

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

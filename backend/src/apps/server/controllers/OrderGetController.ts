import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class OrderGetController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      const { data, error } = await client
        .from("orders")
        .select(`
          *,
          order_items(
            id,
            quantity,
            price_at_purchase,
            product:products(id, name, image_url)
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        res.status(httpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      console.error("OrderGetController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

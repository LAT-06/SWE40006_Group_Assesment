import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class OrderListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];
      const client = token
        ? SupabaseClientFactory.createClientWithToken(token)
        : SupabaseClientFactory.createClient();

      const { data, error } = await client
        .from("orders")
        .select(
          `
          *,
          user:profiles(id, full_name, email),
          order_items(
            id,
            quantity,
            price_at_purchase,
            product:products(id, name, image_url)
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      console.error("OrderListController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

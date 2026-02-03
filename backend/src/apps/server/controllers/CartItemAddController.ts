import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CartItemAddController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { product_id, quantity } = req.body;
      const client = SupabaseClientFactory.createClient();

      if (!product_id || !quantity) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing product_id or quantity" });
        return;
      }

      // 1. Get Cart
      let { data: cart } = await client.from("carts").select("id").eq("user_id", user.id).single();
      if (!cart) {
        const { data: newCart } = await client.from("carts").insert({ user_id: user.id }).select("id").single();
        cart = newCart;
      }

      // 2. Upsert Item
      const { data, error } = await client
        .from("cart_items")
        .upsert(
          { cart_id: cart!.id, product_id, quantity },
          { onConflict: "cart_id, product_id" }
        )
        .select()
        .single();

      if (error) throw error;
      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

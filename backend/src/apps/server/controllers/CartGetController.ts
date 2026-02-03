import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CartGetController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const client = SupabaseClientFactory.createClient();

      // 1. Get or Create Cart for user
      let { data: cart, error: cartError } = await client
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cartError && cartError.code === "PGRST116") { // Not found
        const { data: newCart, error: createError } = await client
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) throw cartError;

      // 2. Get Cart Items
      const { data: items, error: itemsError } = await client
        .from("cart_items")
        .select(`
          id,
          quantity,
          added_at,
          product:products(*)
        `)
        .eq("cart_id", cart!.id);

      if (itemsError) throw itemsError;

      res.status(httpStatus.OK).json({ cart_id: cart!.id, items });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

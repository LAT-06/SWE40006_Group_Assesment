import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class OrderCreateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { shipping_address, items, delivery_slot_id, notes } = req.body;

      if (!shipping_address) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Shipping address is required" });
        return;
      }

      const serviceClient = SupabaseClientFactory.createClient();

      let orderItemsToInsert: any[] = [];
      let totalAmount = 0;

      if (Array.isArray(items) && items.length > 0) {
        // Items sent directly from frontend (preferred path)
        const productIds = items.map((i: any) => i.product_id).filter(Boolean);
        const { data: products, error: prodError } = await serviceClient
          .from("products")
          .select("id, price")
          .in("id", productIds);

        if (prodError || !products) {
          res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: "Failed to look up product prices" });
          return;
        }

        const priceMap = new Map(products.map((p: any) => [p.id, p.price]));

        for (const item of items) {
          const price = priceMap.get(item.product_id) ?? 0;
          totalAmount += price * item.quantity;
          orderItemsToInsert.push({
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: price,
          });
        }
      } else {
        // Fallback: read from DB cart
        const { data: cart, error: cartError } = await serviceClient
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (cartError || !cart) {
          res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: "Cart is empty and no items provided" });
          return;
        }

        const { data: cartItems, error: itemsError } = await serviceClient
          .from("cart_items")
          .select("quantity, product_id, product:products(price)")
          .eq("cart_id", cart.id);

        if (itemsError || !cartItems || cartItems.length === 0) {
          res.status(httpStatus.BAD_REQUEST).json({ error: "Cart is empty" });
          return;
        }

        cartItems.forEach((item: any) => {
          const price = item.product?.price ?? 0;
          totalAmount += price * item.quantity;
          orderItemsToInsert.push({
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: price,
          });
        });

        // Clear DB cart
        await serviceClient.from("cart_items").delete().eq("cart_id", cart.id);
      }

      if (orderItemsToInsert.length === 0) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "No valid items to order" });
        return;
      }

      // Create order
      const orderData: any = {
        user_id: user.id,
        total_amount: totalAmount,
        status: "pending",
        shipping_address,
      };
      if (delivery_slot_id) orderData.delivery_slot_id = delivery_slot_id;
      if (notes) orderData.notes = notes;

      const { data: order, error: orderError } = await serviceClient
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: orderError?.message || "Failed to create order" });
        return;
      }

      // Insert order items
      const itemsWithOrderId = orderItemsToInsert.map((item) => ({
        ...item,
        order_id: order.id,
      }));
      const { error: orderItemsError } = await serviceClient
        .from("order_items")
        .insert(itemsWithOrderId);

      if (orderItemsError) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: orderItemsError.message });
        return;
      }

      res
        .status(httpStatus.CREATED)
        .json({ order_id: order.id, total_amount: totalAmount });
    } catch (err: any) {
      console.error("OrderCreateController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

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

      const serviceClient = SupabaseClientFactory.createClientWithToken(req.token!);

      let orderItemsToInsert: any[] = [];
      let totalAmount = 0;

      if (Array.isArray(items) && items.length > 0) {
        // Items sent directly from frontend (preferred path)
        const productIds = items.map((i: any) => i.product_id).filter(Boolean);
        const { data: products, error: prodError } = await serviceClient
          .from("products")
          .select("id, price, quantity, in_stock, name")
          .in("id", productIds);

        if (prodError || !products) {
          res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: "Failed to look up product prices" });
          return;
        }

        const productMap = new Map(products.map((p: any) => [p.id, p]));

        for (const item of items) {
          const product = productMap.get(item.product_id);
          if (!product) continue;

          const available: number = product.quantity ?? 0;

          if (available <= 0) {
            res.status(httpStatus.BAD_REQUEST).json({
              error: `"${product.name}" is out of stock.`,
              product_id: item.product_id,
              out_of_stock: true,
            });
            return;
          }

          // Clamp to available stock if requested more than we have
          const quantity = Math.min(item.quantity, available);

          totalAmount += product.price * quantity;
          orderItemsToInsert.push({
            product_id: item.product_id,
            quantity,
            price_at_purchase: product.price,
            // Pass back if we had to clamp
            _requested: item.quantity,
            _clamped: quantity < item.quantity,
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
          .select("quantity, product_id, product:products(price, quantity, in_stock, name)")
          .eq("cart_id", cart.id);

        if (itemsError || !cartItems || cartItems.length === 0) {
          res.status(httpStatus.BAD_REQUEST).json({ error: "Cart is empty" });
          return;
        }

        cartItems.forEach((item: any) => {
          const price = item.product?.price ?? 0;
          const available: number = item.product?.quantity ?? 0;

          if (available <= 0) return; // skip out-of-stock items silently in cart path

          const quantity = Math.min(item.quantity, available);
          totalAmount += price * quantity;
          orderItemsToInsert.push({
            product_id: item.product_id,
            quantity,
            price_at_purchase: price,
            _requested: item.quantity,
            _clamped: quantity < item.quantity,
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

      // Insert order items (strip internal helper fields)
      const itemsWithOrderId = orderItemsToInsert.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
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

      // Deduct stock quantities atomically via DB function
      for (const item of orderItemsToInsert) {
        await serviceClient.rpc("decrement_product_quantity", {
          p_product_id: item.product_id,
          p_amount: item.quantity,
        });
      }

      // Inform the client if any quantities were clamped to available stock
      const clampedItems = orderItemsToInsert
        .filter((i) => i._clamped)
        .map((i) => ({ product_id: i.product_id, ordered: i.quantity, requested: i._requested }));

      res.status(httpStatus.CREATED).json({
        order_id: order.id,
        total_amount: totalAmount,
        ...(clampedItems.length > 0 && {
          notice: "Some item quantities were reduced to match available stock.",
          adjusted_items: clampedItems,
        }),
      });
    } catch (err: any) {
      console.error("OrderCreateController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

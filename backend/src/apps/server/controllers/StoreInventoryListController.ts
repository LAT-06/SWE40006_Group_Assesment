import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

/**
 * GET /stores/:storeId/inventory  — public, returns all products with their stock status for a store
 * GET /products/:productId/stores — public, returns all stores and whether they carry a product
 *
 * This controller handles both patterns based on the query parameter `mode`.
 * The route file registers it under both paths for clarity.
 */

export class StoreInventoryListController {
  /** GET /stores/:storeId/inventory */
  async byStore(req: Request, res: Response): Promise<void> {
    try {
      const storeId = req.params.storeId as string;
      const client = SupabaseClientFactory.createClient();

      const { data, error } = await client
        .from("store_inventory")
        .select("*, product:products(id, name, image_url, price, in_stock)")
        .eq("store_id", storeId)
        .order("updated_at", { ascending: false });

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json({ data });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }

  /** GET /products/:productId/stores — which stores carry this product */
  async byProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId as string;
      const client = SupabaseClientFactory.createClient();

      // Get all active stores, left-join inventory so we show even stores with no record
      const { data: stores, error: storeErr } = await client
        .from("stores")
        .select("id, name, address, phone, opening_hours, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (storeErr) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: storeErr.message });
        return;
      }

      const { data: inventory, error: invErr } = await client
        .from("store_inventory")
        .select("store_id, quantity, in_stock")
        .eq("product_id", productId);

      if (invErr) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: invErr.message });
        return;
      }

      const invMap = new Map(inventory?.map((i) => [i.store_id, i]) ?? []);

      const result = (stores ?? []).map((s) => {
        const inv = invMap.get(s.id);
        return {
          ...s,
          quantity: inv?.quantity ?? 0,
          in_stock: inv?.in_stock ?? false,
        };
      });

      res.status(httpStatus.OK).json({ data: result });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

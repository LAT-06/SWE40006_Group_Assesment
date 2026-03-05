import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

/**
 * PATCH /admin/stores/:storeId/inventory/:productId
 * Body: { quantity?: number, in_stock?: boolean }
 * Creates or updates the store_inventory row (upsert).
 */
export class StoreInventoryUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const storeId = req.params.storeId as string;
      const productId = req.params.productId as string;
      const { quantity, in_stock } = req.body;

      if (quantity === undefined && in_stock === undefined) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Provide quantity or in_stock" });
        return;
      }

      const updates: Record<string, any> = { store_id: storeId, product_id: productId };
      if (quantity !== undefined) updates.quantity = quantity;
      if (in_stock !== undefined) updates.in_stock = in_stock;

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { data, error } = await client
        .from("store_inventory")
        .upsert(
          {
            store_id: storeId,
            product_id: productId,
            ...(quantity !== undefined ? { quantity } : {}),
            ...(in_stock !== undefined ? { in_stock } : {}),
          },
          { onConflict: "store_id,product_id" },
        )
        .select()
        .single();

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json({ data });
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CartItemRemoveController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      const { error } = await client.from("cart_items").delete().eq("id", id);
      if (error) throw error;

      res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

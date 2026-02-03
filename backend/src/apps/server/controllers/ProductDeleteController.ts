import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductDeleteController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing product ID" });
        return;
      }

      const client = SupabaseClientFactory.createClient();

      const { error } = await client
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete Product Error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      console.error("Controller Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class CategoryDeleteController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Missing category ID" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);
      const { error } = await client.from("categories").delete().eq("id", id);

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class DeliveryZoneDeleteController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      // Check no active slots reference this zone
      const { count } = await client
        .from("delivery_slots")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", id);

      if (count && count > 0) {
        res
          .status(httpStatus.CONFLICT)
          .json({ error: `Cannot delete: ${count} delivery slot(s) reference this zone. Remove or reassign them first.` });
        return;
      }

      const { error } = await client
        .from("delivery_zones")
        .delete()
        .eq("id", id);

      if (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

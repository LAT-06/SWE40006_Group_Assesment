import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class ProductListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const client = SupabaseClientFactory.createClient();
      
      const { data, error } = await client
        .from('products')
        .select(`
          *,
          category:categories(name, slug)
        `);

      if (error) {
        console.error('Supabase error:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      console.error('Controller error:', err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

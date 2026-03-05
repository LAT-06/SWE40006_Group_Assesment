import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Server } from '../src/apps/server/app.js';
import { SupabaseClientFactory } from '../src/Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js';
describe('Product API', () => {
    let server;
    let app;
    beforeEach(() => {
        server = new Server('3000');
        app = server.httpServer;
        vi.restoreAllMocks();
    });
    it('GET /products should return a list of products', async () => {
        const mockProducts = [
            { id: '1', name: 'Product 1', price: 10, category: { name: 'Cat 1', slug: 'cat-1' } }
        ];
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        };
        vi.spyOn(SupabaseClientFactory, 'createClient').mockReturnValue(mockSupabase);
        const response = await request(app).get('/products');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProducts);
        expect(mockSupabase.from).toHaveBeenCalledWith('products');
    });
    it('GET /products should handle errors', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
        };
        vi.spyOn(SupabaseClientFactory, 'createClient').mockReturnValue(mockSupabase);
        const response = await request(app).get('/products');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'DB Error' });
    });
});
//# sourceMappingURL=product.test.js.map
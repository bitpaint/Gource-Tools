// Tests d'intégration pour l'API /api/renders
const request = require('supertest');
let app;

beforeAll(() => {
  app = require('../index');
});

describe('API /api/renders', () => {
  it('GET /api/renders doit retourner un tableau', async () => {
    const res = await request(app).get('/api/renders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  // Ajoutez ici d'autres tests de création/suppression si besoin
});

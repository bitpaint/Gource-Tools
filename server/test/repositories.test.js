// Test d'intégration simple de l'API /api/repositories avec Jest et Supertest
// Lancer avec : npx jest server/test/repositories.test.js

const request = require('supertest');
const express = require('express');

let app;

beforeAll(() => {
  // Charger l'app Express principale
  app = require('../index');
});

describe('API /api/repositories', () => {
  let createdRepoId;

  it('GET /api/repositories doit retourner un tableau', async () => {
    const res = await request(app).get('/api/repositories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/repositories ajoute un dépôt et le retourne', async () => {
    const res = await request(app)
      .post('/api/repositories')
      .send({ url: 'https://github.com/octocat/Hello-World.git', name: 'Hello-World' });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id');
    createdRepoId = res.body.id;
  });

  it('GET /api/repositories/:id retourne le dépôt créé', async () => {
    if (!createdRepoId) return;
    const res = await request(app).get(`/api/repositories/${createdRepoId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdRepoId);
  });

  it('DELETE /api/repositories/:id supprime le dépôt', async () => {
    if (!createdRepoId) return;
    const res = await request(app).delete(`/api/repositories/${createdRepoId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/repositories/:id sur un id inconnu retourne 404', async () => {
    const res = await request(app).get('/api/repositories/doesnotexist');
    expect([404, 400]).toContain(res.statusCode);
  });
});

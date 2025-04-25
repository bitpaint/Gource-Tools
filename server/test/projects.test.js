// Tests d'intégration pour l'API /api/projects
const request = require('supertest');
let app;

beforeAll(() => {
  app = require('../index');
});

describe('API /api/projects', () => {
  let createdProjectId;
  const projectData = { name: 'Test Project', repositories: [] };

  it('GET /api/projects doit retourner un tableau', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/projects crée un projet', async () => {
    const res = await request(app).post('/api/projects').send(projectData);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id');
    createdProjectId = res.body.id;
  });

  it('GET /api/projects/:id retourne le projet créé', async () => {
    if (!createdProjectId) return;
    const res = await request(app).get(`/api/projects/${createdProjectId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdProjectId);
  });

  it('PUT /api/projects/:id met à jour le projet', async () => {
    if (!createdProjectId) return;
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .send({ name: 'Projet Modifié' });
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('name', 'Projet Modifié');
  });

  it('DELETE /api/projects/:id supprime le projet', async () => {
    if (!createdProjectId) return;
    const res = await request(app).delete(`/api/projects/${createdProjectId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

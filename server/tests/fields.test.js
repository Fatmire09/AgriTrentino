// US65: test automatizzati per la gestione appezzamenti (CRUD) — RFN06.
const request = require('supertest');
const app = require('../index');

const utente = { email: 'agricoltore@unitn.it', password: 'password123', nome: 'Agri' };
const campo = {
  nome: 'Vigneto Nord',
  latitudine: 46.07,
  longitudine: 11.12,
  superficie: 1.5,
  pendenza: 20,
  esposizione: 'Sud',
};

async function tokenUtente(u = utente) {
  await request(app).post('/api/v1/auth/register').send(u);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: u.email, password: u.password });
  return res.body.token;
}

describe('Appezzamenti — /api/v1/fields', () => {
  describe('POST /fields', () => {
    test('senza token → 401', async () => {
      const res = await request(app).post('/api/v1/fields').send(campo);
      expect(res.status).toBe(401);
    });

    test('con token valido → 201', async () => {
      const token = await tokenUtente();
      const res = await request(app)
        .post('/api/v1/fields')
        .set('Authorization', `Bearer ${token}`)
        .send(campo);
      expect(res.status).toBe(201);
    });

    test('campi obbligatori mancanti → 400', async () => {
      const token = await tokenUtente();
      const res = await request(app)
        .post('/api/v1/fields')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Senza coordinate' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /fields', () => {
    test('senza token → 401', async () => {
      const res = await request(app).get('/api/v1/fields');
      expect(res.status).toBe(401);
    });

    test('restituisce solo i campi dell\'utente autenticato', async () => {
      const token = await tokenUtente();
      await request(app)
        .post('/api/v1/fields')
        .set('Authorization', `Bearer ${token}`)
        .send(campo);

      const res = await request(app)
        .get('/api/v1/fields')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.fields)).toBe(true);
      expect(res.body.fields.length).toBe(1);
      expect(res.body.fields[0].nome).toBe(campo.nome);
    });
  });
});
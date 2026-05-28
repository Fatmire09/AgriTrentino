// US65: test automatizzati per l'autenticazione (RFN06).
const request = require('supertest');
const app = require('../index');

const utente = { email: 'mario@unitn.it', password: 'password123', nome: 'Mario' };

describe('Autenticazione — /api/v1/auth', () => {
  describe('POST /register', () => {
    test('registra un nuovo utente → 201', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(utente);
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(utente.email);
    });

    test('campi obbligatori mancanti → 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'password123', nome: 'Mario' });
      expect(res.status).toBe(400);
    });

    test('password troppo corta → 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'a@b.it', password: '123', nome: 'X' });
      expect(res.status).toBe(400);
    });

    test('email duplicata → 409', async () => {
      await request(app).post('/api/v1/auth/register').send(utente);
      const res = await request(app).post('/api/v1/auth/register').send(utente);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(utente);
    });

    test('credenziali corrette → 200 con token JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: utente.email, password: utente.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('password errata → 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: utente.email, password: 'sbagliata123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /me (rotta protetta)', () => {
    test('senza token → 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    test('con token valido → 200 e dati utente corretti', async () => {
      await request(app).post('/api/v1/auth/register').send(utente);
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: utente.email, password: utente.password });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(utente.email);
    });
  });
});

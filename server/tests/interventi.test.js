// US65: test automatizzati per il registro interventi — RFN06.
const request = require('supertest');
const app = require('../index');

const utente = { email: 'interventi@unitn.it', password: 'password123', nome: 'Int' };
const campo = { nome: 'Campo Test', latitudine: 46.0, longitudine: 11.1, superficie: 1 };

async function setup() {
  await request(app).post('/api/v1/auth/register').send(utente);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: utente.email, password: utente.password });
  const token = login.body.token;
  const field = await request(app)
    .post('/api/v1/fields')
    .set('Authorization', `Bearer ${token}`)
    .send(campo);
  return { token, fieldId: field.body.field._id };
}

describe('Interventi — /api/v1/fields/:fieldId/interventi', () => {
  test('POST trattamento valido → 201', async () => {
    const { token, fieldId } = await setup();
    const res = await request(app)
      .post(`/api/v1/fields/${fieldId}/interventi`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipologia: 'trattamento', principioAttivo: 'rame', quantita: 2, unitaMisura: 'kg/ha' });
    expect(res.status).toBe(201);
    expect(res.body.intervento.principioAttivo).toBe('rame');
  });

  test('POST irrigazione valida → 201', async () => {
    const { token, fieldId } = await setup();
    const res = await request(app)
      .post(`/api/v1/fields/${fieldId}/interventi`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipologia: 'irrigazione', volumeAcqua: 150 });
    expect(res.status).toBe(201);
    expect(res.body.intervento.volumeAcqua).toBe(150);
  });

  test('POST trattamento senza principio attivo → 400', async () => {
    const { token, fieldId } = await setup();
    const res = await request(app)
      .post(`/api/v1/fields/${fieldId}/interventi`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipologia: 'trattamento', quantita: 2 });
    expect(res.status).toBe(400);
  });

  test('POST senza token → 401', async () => {
    const { fieldId } = await setup();
    const res = await request(app)
      .post(`/api/v1/fields/${fieldId}/interventi`)
      .send({ tipologia: 'irrigazione', volumeAcqua: 100 });
    expect(res.status).toBe(401);
  });

  test('GET lista interventi → 200 con gli interventi registrati', async () => {
    const { token, fieldId } = await setup();
    await request(app)
      .post(`/api/v1/fields/${fieldId}/interventi`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipologia: 'irrigazione', volumeAcqua: 200 });

    const res = await request(app)
      .get(`/api/v1/fields/${fieldId}/interventi`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.interventi)).toBe(true);
    expect(res.body.interventi.length).toBe(1);
  });
});
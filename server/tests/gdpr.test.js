// US63: test cancellazione a cascata / diritto all'oblio (RFN09).
const request = require('supertest');
const app = require('../index');
const Field = require('../models/Field');
const User = require('../models/User');
const Intervento = require('../models/Intervento');

const utente = { email: 'gdpr@unitn.it', password: 'password123', nome: 'Gdpr' };

async function setup() {
  await request(app).post('/api/v1/auth/register').send(utente);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: utente.email, password: utente.password });
  const token = login.body.token;
  const field = await request(app)
    .post('/api/v1/fields')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Campo GDPR', latitudine: 46, longitudine: 11, superficie: 1 });
  const fieldId = field.body.field._id;
  await request(app)
    .post(`/api/v1/fields/${fieldId}/interventi`)
    .set('Authorization', `Bearer ${token}`)
    .send({ tipologia: 'irrigazione', volumeAcqua: 100 });
  return { token, fieldId };
}

describe('GDPR – cancellazione a cascata (US63 / RFN09)', () => {
  test('eliminando un campo si eliminano anche i suoi interventi', async () => {
    const { token, fieldId } = await setup();
    expect(await Intervento.countDocuments({ appezzamentoId: fieldId })).toBe(1);

    const res = await request(app)
      .delete(`/api/v1/fields/${fieldId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    expect(await Field.countDocuments({ _id: fieldId })).toBe(0);
    expect(await Intervento.countDocuments({ appezzamentoId: fieldId })).toBe(0);
  });

  test('DELETE /auth/me elimina account, campi e dati associati', async () => {
    const { token, fieldId } = await setup();

    const res = await request(app)
      .delete('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    expect(await User.countDocuments({ email: utente.email })).toBe(0);
    expect(await Field.countDocuments({ _id: fieldId })).toBe(0);
    expect(await Intervento.countDocuments({ appezzamentoId: fieldId })).toBe(0);
  });

  test('DELETE /auth/me senza token → 401', async () => {
    const res = await request(app).delete('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
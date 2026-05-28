// US62: test di controllo accessi multi-utente (RFN08).
// Verifica che un utente non possa in alcun modo accedere ai dati di un altro utente.
const request = require('supertest');
const app = require('../index');

const utenteA = { email: 'utente-a@unitn.it', password: 'password123', nome: 'Alice' };
const utenteB = { email: 'utente-b@unitn.it', password: 'password123', nome: 'Bob' };
const campo = { nome: 'Campo di Alice', latitudine: 46.0, longitudine: 11.1, superficie: 1 };

async function token(u) {
  await request(app).post('/api/v1/auth/register').send(u);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: u.email, password: u.password });
  return res.body.token;
}

describe('Controllo accessi multi-utente (US62 / RFN08)', () => {
  let tokenA;
  let tokenB;
  let campoIdA;

  beforeEach(async () => {
    tokenA = await token(utenteA);
    tokenB = await token(utenteB);
    const res = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(campo);
    campoIdA = res.body.field._id;
  });

  test('GET /fields restituisce solo i propri campi (B non vede quello di A)', async () => {
    const res = await request(app)
      .get('/api/v1/fields')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.fields.length).toBe(0);
  });

  test('B NON può leggere il dettaglio del campo di A → 403', async () => {
    const res = await request(app)
      .get(`/api/v1/fields/${campoIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  test('B NON può modificare il campo di A → 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/fields/${campoIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nome: 'Tentativo di Bob' });
    expect(res.status).toBe(403);
  });

  test('B NON può eliminare il campo di A → 403', async () => {
    const res = await request(app)
      .delete(`/api/v1/fields/${campoIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  test('B NON può registrare un intervento sul campo di A → 403', async () => {
    const res = await request(app)
      .post(`/api/v1/fields/${campoIdA}/interventi`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ tipologia: 'irrigazione', volumeAcqua: 100 });
    expect(res.status).toBe(403);
  });

  test('B NON può leggere gli interventi del campo di A → 403', async () => {
    const res = await request(app)
      .get(`/api/v1/fields/${campoIdA}/interventi`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  test('A (proprietario) accede regolarmente al proprio campo → 200', async () => {
    const res = await request(app)
      .get(`/api/v1/fields/${campoIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.field.nome).toBe(campo.nome);
  });
});

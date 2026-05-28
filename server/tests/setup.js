// US65: setup comune dei test.
// Avvia un MongoDB in-memory (mongodb-memory-server) così i test girano
// in isolamento, senza toccare il database reale (Atlas/locale).
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-jwt';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Pulisce tutte le collection tra un test e l'altro per garantire isolamento
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

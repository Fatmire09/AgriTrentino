require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

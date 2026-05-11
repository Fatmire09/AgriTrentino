const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email obbligatoria'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato email non valido'],
    },
    password: {
      type: String,
      required: [true, 'Password obbligatoria'],
      minlength: [8, 'La password deve essere di almeno 8 caratteri'],
    },
    nome: {
      type: String,
      required: [true, 'Nome obbligatorio'],
      trim: true,
    },
    nomeAzienda: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    autenticato: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
module.exports = mongoose.model('User', userSchema);

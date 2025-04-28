const mongoose = require('mongoose');

const usuario = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: String,
    password: String,
    fecha_nacimiento: Date,
    fecha_registro: { type: Date, default: Date.now },
    imagen: String,
})

module.exports = mongoose.model('usuario', usuario);
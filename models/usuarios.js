const mongoose = require('mongoose');

const usuario = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    fecha_nacimiento: Date,
    fecha_registro: { type: Date, default: Date.now },
    imagen: String,
})

module.exports = mongoose.model('usuario', usuario);
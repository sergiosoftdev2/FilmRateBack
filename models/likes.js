const mongoose = require('mongoose');

const like = new mongoose.Schema({
    user_id: {
        type: String,
        unique: true
    },
    movie_id: {
        type: String,
        unique: true
    },
    fecha_creacion: { type: Date, default: Date.now },
})

module.exports = mongoose.model('like', like);
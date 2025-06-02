const mongoose = require('mongoose');

const like = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    movie_id: {
        type: String,
        required: true
    },
    fecha_creacion: { type: Date, default: Date.now },
})

like.index({ user_id: 1, movie_id: 1 }, { unique: true });

module.exports = mongoose.model('like', like);
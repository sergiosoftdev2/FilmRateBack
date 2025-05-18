const mongoose = require('mongoose');

const rating = new mongoose.Schema({
    user_id: String,
    movie_id: String,
    critic: String,
    rating: Number,
    fecha_creacion: { type: Date, default: Date.now },

})

module.exports = mongoose.model('rating', rating);
const mongoose = require('mongoose');

const rating = new mongoose.Schema({
    user_id: String,
    movie_id: String,
    movie_poster: String,
    critic: String,
    rating: Number,
    liked: Boolean,
    watchlist: Boolean,
    fecha_creacion: { type: Date, default: Date.now },

})

module.exports = mongoose.model('rating', rating);
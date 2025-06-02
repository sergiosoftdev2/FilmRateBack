const mongoose = require('mongoose');

const follow = new mongoose.Schema({
    following_user_id: {
        type: String,
        required: true
    },
    follower_user_id: {
        type: String,
        required: true
    },
    fecha_creacion: { type: Date, default: Date.now },
})

follow.index({ following_user_id: 1, follower_user_id: 1 }, { unique: true });

module.exports = mongoose.model('follow', follow);
const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
    date: { type: String, required: true },
    score: { type: Number, min: 1, max: 10, required: true },
    stress: { type: Number, min: 1, max: 10 },
    energy: { type: Number, min: 1, max: 10 },
    emotion: { type: String },
    triggers: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Mood', MoodSchema);

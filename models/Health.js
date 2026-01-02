const mongoose = require('mongoose');

const HealthSchema = new mongoose.Schema({
    date: { type: String, required: true },
    sleep: { type: Number }, // hours
    water: { type: Number }, // liters
    exercise: { type: String }, // type + duration
    steps: { type: Number },
    condition: { type: String, enum: ['Normal', 'Tired', 'Pain', 'Sick'], default: 'Normal' },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Health', HealthSchema);

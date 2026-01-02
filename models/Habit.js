const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    date: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Health', 'Study', 'Work', 'Mind', 'Personal'], required: true },
    status: { type: String, enum: ['✅ Done', '❌ Missed'], required: true },
    streak: { type: Number, default: 0 },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Habit', HabitSchema);

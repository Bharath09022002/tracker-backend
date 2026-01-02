const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    date: { type: String, required: true },
    type: { type: String, enum: ['Reflection', 'Idea', 'Issue', 'Gratitude'], required: true },
    content: { type: String, required: true },
    insight: { type: String, enum: ['Low', 'Medium', 'High'] }
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);

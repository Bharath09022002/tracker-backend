const mongoose = require('mongoose');

const StudyWorkSchema = new mongoose.Schema({
    date: { type: String, required: true },
    area: { type: String, enum: ['Study', 'Work'], required: true },
    topic: { type: String, required: true },
    duration: { type: Number, required: true }, // mins
    focus: { type: Number, min: 1, max: 10 },
    output: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudyWork', StudyWorkSchema);

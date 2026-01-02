const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    date: { type: String, required: true },
    name: { type: String, required: true },
    project: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
    estTime: { type: Number }, // in mins
    actTime: { type: Number }, // in mins
    energy: { type: String, enum: ['Low', 'Medium', 'High'] }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);

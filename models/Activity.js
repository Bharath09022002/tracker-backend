const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    days: {
        type: Number,
        required: true,
        default: 30
    },
    color: {
        type: String,
        default: 'var(--accent-blue)'
    },
    progress: [{
        type: Boolean,
        default: false
    }]
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);

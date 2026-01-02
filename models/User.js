const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    settings: {
        emailNotificationsEnabled: { type: Boolean, default: false },
        notificationEmail: { type: String },  // User's email for receiving notifications (can be different from login email)
        dailyBriefing: {
            enabled: { type: Boolean, default: true },
            time: { type: String, default: '08:00' } // HH:MM format
        },
        eveningReview: {
            enabled: { type: Boolean, default: true },
            time: { type: String, default: '20:00' } // HH:MM format
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

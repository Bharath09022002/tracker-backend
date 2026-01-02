const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
const Habit = require('./models/Habit');
const Task = require('./models/Task');
const Health = require('./models/Health');
const Mood = require('./models/Mood');
const StudyWork = require('./models/StudyWork');
const Note = require('./models/Note');
const createRouter = require('./routes/genericRoute');

app.use('/api/habits', createRouter(Habit));
app.use('/api/tasks', createRouter(Task));
app.use('/api/health', createRouter(Health));
app.use('/api/mood', createRouter(Mood));
app.use('/api/productivity', createRouter(StudyWork));
app.use('/api/notes', createRouter(Note));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/email', require('./routes/email'));
app.use('/api/activities', require('./routes/activities'));

// Automatic Email scheduling
const cron = require('node-cron');
const User = require('./models/User');
const { sendEmail } = require('./routes/email');

// Schedule daily briefings and reviews based on user settings
const scheduleEmailNotifications = () => {
    cron.schedule('* * * * *', async () => { // Check every minute
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM

        try {
            const users = await User.find({ 'settings.emailNotificationsEnabled': true });

            for (const user of users) {
                const email = user.settings.notificationEmail || user.email;
                if (!email) continue;

                // Check briefing
                if (user.settings.dailyBriefing?.enabled && user.settings.dailyBriefing.time === currentTime) {
                    const today = now.toISOString().split('T')[0];
                    const pendingTasks = await Task.find({ completed: false, user: user._id, date: { $gte: today } });
                    const message = `🌞 *Automated Briefing*\n\nYour daily briefing at ${currentTime}.\n\nSent from Notion OS`;
                    await sendEmail(email, '🌞 Your Daily Briefing', `<p>${message}</p>`);
                }

                // Check review
                if (user.settings.eveningReview?.enabled && user.settings.eveningReview.time === currentTime) {
                    const message = `🌙 *Automated Review*\n\nYour evening review at ${currentTime}.\n\nSent from Notion OS`;
                    await sendEmail(email, '🌙 Your Evening Review', `<p>${message}</p>`);
                }
            }
        } catch (error) {
            console.error('Cron job error:', error);
        }
    });
};

// Only run cron jobs in non-serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    scheduleEmailNotifications();
}

app.get('/', (req, res) => {
    res.send('Notion OS API is running...');
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notion_os')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('👉 TIP: Ensure MongoDB service is RUNNING on your machine.');
    });

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for serverless deployment
module.exports = app;

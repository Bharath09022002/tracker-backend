const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Helper functions for detailed stats
const calculateEfficiency = (habits, tasks) => {
    const habitScore = habits.length > 0 ? (habits.filter(h => h.status === '✅ Done').length / habits.length) * 50 : 0;
    const taskScore = tasks.length > 0 ? ((tasks.length - tasks.filter(t => !t.completed).length) / tasks.length) * 50 : 50;
    return Math.round(habitScore + taskScore);
};

const getFocusAreas = (habits) => {
    const pending = habits.filter(h => h.status !== '✅ Done');
    return pending.length > 0 ? pending.map(h => h.name).join(', ') : 'All habits on track';
};

const generateSuggestions = (habits, completedTasks, pendingTasks) => {
    let suggestions = [];
    if (pendingTasks > 5) suggestions.push('Consider prioritizing tasks for tomorrow.');
    if (habits.filter(h => h.status !== '✅ Done').length > 0) suggestions.push('Focus on completing pending habits.');
    if (completedTasks < 3) suggestions.push('Try to complete at least 3 tasks daily.');
    return suggestions.length > 0 ? suggestions.map(s => `• ${s}`).join('\n') : 'Great job! Keep up the momentum.';
};

const getStreak = (habits) => {
    const completed = habits.filter(h => h.status === '✅ Done').length;
    return completed > 0 ? `${completed} habits` : 'Start building your streak';
};

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Notion OS" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// @route   POST /api/email/send
// @desc    Send a generic email (testing purposes)
router.post('/send', auth, async (req, res) => {
    const { subject, message } = req.body;
    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    try {
        const user = await User.findById(req.user.id);
        const email = user?.settings?.notificationEmail || user.email;

        await sendEmail(email, subject, `<p>${message}</p>`);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/email/briefing
// @desc    Send detailed daily morning briefing
router.post('/briefing', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const email = user?.settings?.notificationEmail || user.email;

        const today = new Date().toISOString().split('T')[0];
        const pendingTasks = await Task.find({ completed: false, user: req.user.id, date: { $gte: today } });
        const pendingTaskNames = pendingTasks.map(t => `<li>${t.title}</li>`).join('') || '<li>No pending tasks</li>';

        const habits = await Habit.find({ user: req.user.id });
        const habitSummary = habits.map(h => `<li>${h.name}: ${h.status}</li>`).join('') || '<li>No habits configured</li>';

        const totalHabits = habits.length;
        const completedHabits = habits.filter(h => h.status === '✅ Done').length;
        const habitProgress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <h1 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
                    🌞 Daily Briefing - ${new Date().toLocaleDateString()}
                </h1>
                
                <h2 style="color: #4CAF50;">🎯 Pending Objectives (${pendingTasks.length})</h2>
                <ul style="background: white; padding: 20px; border-radius: 8px;">
                    ${pendingTaskNames}
                </ul>

                <h2 style="color: #4CAF50;">✅ Habits Status (${completedHabits}/${totalHabits} - ${habitProgress}%)</h2>
                <ul style="background: white; padding: 20px; border-radius: 8px;">
                    ${habitSummary}
                </ul>

                <h2 style="color: #4CAF50;">📊 Quick Stats</h2>
                <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p><strong>Efficiency:</strong> ${calculateEfficiency(habits, pendingTasks)}%</p>
                    <p><strong>Focus Areas:</strong> ${getFocusAreas(habits)}</p>
                </div>

                <p style="margin-top: 20px; padding: 15px; background: #4CAF50; color: white; border-radius: 8px; text-align: center;">
                    🚀 Have a productive day! Stay focused on your goals.
                </p>

                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    Sent from Notion OS
                </p>
            </div>
        `;

        await sendEmail(email, '🌞 Your Daily Briefing', html);
        res.json({ success: true, message: 'Detailed briefing sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/email/review
// @desc    Send detailed evening review
router.post('/review', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const email = user?.settings?.notificationEmail || user.email;

        const today = new Date().toISOString().split('T')[0];
        const completedTasks = await Task.find({ completed: true, user: req.user.id, date: { $gte: today } });
        const completedTaskNames = completedTasks.map(t => `<li>${t.title}</li>`).join('') || '<li>No tasks completed today</li>';

        const habits = await Habit.find({ user: req.user.id });
        const completedHabits = habits.filter(h => h.status === '✅ Done').length;
        const habitRate = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

        const pendingTasks = await Task.countDocuments({ completed: false, user: req.user.id });
        const suggestions = generateSuggestions(habits, completedTasks.length, pendingTasks);

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e;">
                <h1 style="color: #fff; border-bottom: 3px solid #9c27b0; padding-bottom: 10px;">
                    🌙 Evening Review - ${new Date().toLocaleDateString()}
                </h1>
                
                <h2 style="color: #9c27b0;">🎯 Completed Objectives (${completedTasks.length})</h2>
                <ul style="background: #16213e; color: #fff; padding: 20px; border-radius: 8px;">
                    ${completedTaskNames}
                </ul>

                <h2 style="color: #9c27b0;">✅ Habits Completed: ${completedHabits}/${habits.length} (${habitRate}%)</h2>

                <h2 style="color: #9c27b0;">📊 Day Summary</h2>
                <div style="background: #16213e; color: #fff; padding: 20px; border-radius: 8px;">
                    <p><strong>Tasks Done:</strong> ${completedTasks.length}</p>
                    <p><strong>Pending:</strong> ${pendingTasks}</p>
                    <p><strong>Habit Streak:</strong> ${getStreak(habits)}</p>
                </div>

                <h2 style="color: #9c27b0;">💡 Suggestions</h2>
                <div style="background: #16213e; color: #fff; padding: 20px; border-radius: 8px; white-space: pre-line;">
                    ${suggestions}
                </div>

                <p style="margin-top: 20px; padding: 15px; background: #9c27b0; color: white; border-radius: 8px; text-align: center;">
                    🧘 Reflect on your day. What went well? What to improve?
                </p>

                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    Good night! 😴 | Sent from Notion OS
                </p>
            </div>
        `;

        await sendEmail(email, '🌙 Your Evening Review', html);
        res.json({ success: true, message: 'Detailed review sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
module.exports.sendEmail = sendEmail;

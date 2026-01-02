const express = require('express');
const axios = require('axios');
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
    // Simplified streak calculation
    const completed = habits.filter(h => h.status === '✅ Done').length;
    return completed > 0 ? `${completed} habits` : 'Start building your streak';
};

// Helper function to send message via TextMeBot
const sendWhatsAppMessage = async (text, phone, retries = 3) => {
    // Phone is the recipient (user's number), API key from env (sender's key)
    const finalPhone = phone;
    const finalApiKey = process.env.WHATSAPP_API_KEY;

    if (!finalPhone || !finalApiKey) {
        throw new Error('Missing WhatsApp configuration: user phone or env API_KEY.');
    }

    const encodedText = encodeURIComponent(text);
    const url = `http://api.textmebot.com/send.php?recipient=${finalPhone}&apikey=${finalApiKey}&text=${encodedText}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, { timeout: 10000 });
            // TextMeBot success: check for "Success" in response
            if (response.data.includes('Success') || response.status === 200) {
                return response.data;
            } else {
                throw new Error('Message not confirmed as sent');
            }
        } catch (error) {
            console.error(`TextMeBot Error (Attempt ${attempt}):`, error.message);
            if (attempt === retries) {
                throw new Error(`Failed to send WhatsApp message after ${retries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

// @route   POST /api/whatsapp/send
// @desc    Send a generic message (testing purposes)
router.post('/send', auth, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        // Get user's phone from settings
        const user = await User.findById(req.user.id);
        const phone = user?.settings?.whatsappPhone;

        await sendWhatsAppMessage(message, phone);
        res.json({ success: true, message: 'Message sent successfully to your number' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/whatsapp/briefing
// @desc    Send detailed daily morning briefing
router.post('/briefing', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const phone = user?.settings?.whatsappPhone;

        const today = new Date().toISOString().split('T')[0];
        const pendingTasks = await Task.find({ completed: false, user: req.user.id, date: { $gte: today } });
        const pendingTaskNames = pendingTasks.map(t => `• ${t.title}`).join('\n') || 'No pending tasks';

        const habits = await Habit.find({ user: req.user.id });
        const habitSummary = habits.map(h => `• ${h.name}: ${h.status}`).join('\n') || 'No habits configured';

        const totalHabits = habits.length;
        const completedHabits = habits.filter(h => h.status === '✅ Done').length;
        const habitProgress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

        const message = `🌞 *Detailed Daily Briefing - ${new Date().toLocaleDateString()}*\n\n🎯 *Pending Objectives (${pendingTasks.length}):*\n${pendingTaskNames}\n\n✅ *Habits Status (${completedHabits}/${totalHabits} - ${habitProgress}%):*\n${habitSummary}\n\n📊 *Quick Stats:*\n- Efficiency: ${calculateEfficiency(habits, pendingTasks)}%\n- Focus Areas: ${getFocusAreas(habits)}\n\n⏰ *Timeline Reminder:* Check your schedule for today's events.\n\n🚀 Have a productive day! Stay focused on your goals.\n\nSent from Notion OS`;

        await sendWhatsAppMessage(message, phone);
        res.json({ success: true, message: 'Detailed briefing sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/whatsapp/review
// @desc    Send detailed evening review
router.post('/review', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const phone = user?.settings?.whatsappPhone;

        const today = new Date().toISOString().split('T')[0];
        const completedTasks = await Task.find({ completed: true, user: req.user.id, date: { $gte: today } });
        const completedTaskNames = completedTasks.map(t => `• ${t.title}`).join('\n') || 'No tasks completed today';

        const habits = await Habit.find({ user: req.user.id });
        const completedHabits = habits.filter(h => h.status === '✅ Done').length;
        const habitRate = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

        const pendingTasks = await Task.countDocuments({ completed: false, user: req.user.id });
        const suggestions = generateSuggestions(habits, completedTasks.length, pendingTasks);

        const message = `🌙 *Detailed Evening Review - ${new Date().toLocaleDateString()}*\n\n🎯 *Completed Objectives (${completedTasks.length}):*\n${completedTaskNames}\n\n✅ *Habits Completed:* ${completedHabits}/${habits.length} (${habitRate}%)\n\n📊 *Day Summary:*\n- Tasks Done: ${completedTasks.length}\n- Pending: ${pendingTasks}\n- Habit Streak: ${getStreak(habits)}\n\n💡 *Suggestions:*\n${suggestions}\n\n🧘 Reflect on your day. What went well? What to improve?\n\nLog in to update: http://localhost:3000\n\nGood night! 😴\n\nSent from Notion OS`;

        await sendWhatsAppMessage(message, phone);
        res.json({ success: true, message: 'Detailed review sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

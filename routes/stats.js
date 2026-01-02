const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const StudyWork = require('../models/StudyWork');
const Mood = require('../models/Mood');
const Task = require('../models/Task');

router.get('/today', async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Habit Completion %
        const habits = await Habit.find({ date: todayStr });
        const doneHabits = habits.filter(h => h.status === '✅ Done').length;
        const habitPercent = habits.length > 0 ? Math.round((doneHabits / habits.length) * 100) : 0;

        // 2. Total Focus Minutes
        const productivity = await StudyWork.find({ date: todayStr });
        const focusMinutes = productivity.reduce((acc, curr) => acc + curr.duration, 0);

        // 3. Avg Mood & Energy
        const moods = await Mood.find({ date: todayStr });
        const avgMood = moods.length > 0 ? (moods.reduce((acc, curr) => acc + curr.score, 0) / moods.length).toFixed(1) : 0;
        const avgEnergy = moods.length > 0 ? (moods.reduce((acc, curr) => acc + curr.energy, 0) / moods.length).toFixed(1) : 0;

        // 4. Tasks completed vs planned
        const tasks = await Task.find({ date: todayStr });
        const completedTasks = tasks.filter(t => t.status === 'Done').length;

        res.json({
            habitPercent,
            focusMinutes,
            avgMood,
            avgEnergy,
            completedTasks,
            totalTasks: tasks.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

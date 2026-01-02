const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/activities
// @desc    Get user's activities
router.get('/', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(activities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/activities
// @desc    Create a new activity
router.post('/', auth, async (req, res) => {
    const { name, days, color } = req.body;

    try {
        const progress = new Array(Number(days) || 30).fill(false);

        const newActivity = new Activity({
            name,
            days,
            color,
            progress,
            user: req.user.id
        });

        const activity = await newActivity.save();
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/activities/:id
// @desc    Update activity progress or details
router.patch('/:id', auth, async (req, res) => {
    const { progress } = req.body;

    try {
        let activity = await Activity.findById(req.params.id);

        if (!activity) return res.status(404).json({ msg: 'Activity not found' });
        if (activity.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (progress) activity.progress = progress;

        await activity.save();
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/activities/:id
// @desc    Delete activity
router.delete('/:id', auth, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) return res.status(404).json({ msg: 'Activity not found' });
        if (activity.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Activity.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Activity removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

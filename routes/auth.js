const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
    const { email, password, phone } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ email, password, phone });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { user: { id: user.id, isAdmin: user.isAdmin } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, settings: user.settings } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password, phone } = req.body; // Can login with email OR phone? Usually email.

    try {
        // Simple login with email for now, or match phone if provided likely
        let user = await User.findOne({ email });
        if (!user && phone) {
            user = await User.findOne({ phone });
        }

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id, isAdmin: user.isAdmin } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin, settings: user.settings } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/user
// @desc    Get logged in user
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/settings
// @desc    Update user settings
router.post('/settings', auth, async (req, res) => {
    try {
        const { whatsappEnabled, whatsappPhone, whatsappKey } = req.body;
        const user = await User.findById(req.user.id);

        if (whatsappEnabled !== undefined) user.settings.whatsappEnabled = whatsappEnabled;
        if (whatsappPhone) user.settings.whatsappPhone = whatsappPhone;
        if (whatsappKey) user.settings.whatsappKey = whatsappKey;

        await user.save();
        res.json(user.settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/seed-admin
// @desc    Seed the specific Admin user (Internal use)
router.post('/seed-admin', async (req, res) => {
    const email = 'shivanbharath42255@gmail.com';
    const password = 'bharath42255@@';

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({ msg: 'Admin already exists' });
        }

        user = new User({ email, password, isAdmin: true, role: 'admin' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.json({ msg: 'Admin user created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
router.get('/users', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) return res.status(403).json({ msg: 'Access denied' });

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Admin only)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);
        if (!admin.isAdmin) return res.status(403).json({ msg: 'Access denied' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

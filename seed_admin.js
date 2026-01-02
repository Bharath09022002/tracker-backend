const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notion_os');
        console.log('MongoDB Connected');

        const email = 'shivanbharath42255@gmail.com';
        const password = 'bharath42255@@';

        let user = await User.findOne({ email });
        if (user) {
            console.log('Admin already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                email,
                password: hashedPassword,
                isAdmin: true,
                role: 'admin',
                settings: { whatsappEnabled: true }
            });

            await user.save();
            console.log('Admin user created successfully');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedAdmin();

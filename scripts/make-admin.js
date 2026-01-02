const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' }); // Load from parent directory

const email = 'shivanbharath42255@gmail.com'; // The email from your .env

const makeAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        const bcrypt = require('bcryptjs'); // Add bcrypt

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found. Creating new Admin user: ${email}`);
            const newUser = new User({
                email,
                password: 'bharath42255@@',
                isAdmin: true,
                role: 'admin',
                settings: { emailNotificationsEnabled: true, notificationEmail: email }
            });

            const salt = await bcrypt.genSalt(10);
            newUser.password = await bcrypt.hash(newUser.password, salt);

            await newUser.save();
            console.log(`✅ Success! Created new ADMIN user.`);
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: bharath42255@@`);
            process.exit(0);
        }

        user.isAdmin = true;
        user.role = 'admin';
        await user.save();

        console.log(`✅ Success! User ${email} is now an ADMIN.`);
        console.log('Please logout and login again to see the Admin Dashboard.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

makeAdmin();

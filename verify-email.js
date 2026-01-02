const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('--- Email Config Verification ---');
console.log('Loaded keys:', Object.keys(require('dotenv').config().parsed || {}));
console.log('Checking environment variables...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'MISSING/EMPTY');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'MISSING/EMPTY');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'Default (smtp.gmail.com)');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Default (587)');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ CRITICAL: EMAIL_USER and EMAIL_PASSWORD must be set in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

console.log('\nTesting SMTP connection...');
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code === 'EAUTH') {
            console.error('👉 Tip: Check your App Password and Email address.');
        }
    } else {
        console.log('✅ SMTP Connection Successful! Server is ready to send emails.');
    }
});

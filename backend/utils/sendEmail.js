'use strict';

const nodemailer = require('nodemailer');

// transport setup 
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Gmail App Password
        },
    });
};

// mail send function 
const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from:    `"FieldTrack" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true };

    } catch (error) {
        console.error('Email send failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
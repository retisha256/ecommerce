const nodemailer = require('nodemailer');

// Initialize transporter (Gmail example - requires app password)
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'Customerservice.Novuna@gmail.com',
        pass: process.env.GMAIL_PASS || 'your-app-password-here'
    }
});

// Send welcome email to subscriber
async function sendSubscribeEmail(subscriberEmail) {
    try {
        const mailOptions = {
            from: 'Customerservice.Novuna@gmail.com',
            to: 'Customerservice.Novuna@gmail.com',
            subject: 'New Newsletter Subscriber',
            html: `
                <h2>New Newsletter Subscription</h2>
                <p>A new user has subscribed to the newsletter.</p>
                <p><strong>Email:</strong> ${subscriberEmail}</p>
                <p><strong>Subscribed on:</strong> ${new Date().toISOString()}</p>
                <p>You can now send newsletters to this email address.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Newsletter subscription email sent:', info.response);
        return { success: true, message: 'Subscription email sent' };
    } catch (error) {
        console.error('Error sending subscription email:', error);
        return { success: false, message: 'Failed to send email: ' + error.message };
    }
}

// Send password reset email to user
async function sendPasswordResetEmail(userEmail, resetCode) {
    try {
        const resetLink = `http://localhost:5000/reset-password.html?code=${resetCode}&email=${encodeURIComponent(userEmail)}`;
        const mailOptions = {
            from: 'Customerservice.Novuna@gmail.com',
            to: userEmail,
            subject: 'Password Reset - Novuna Electronics',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <a href="${resetLink}" style="background-color: #6B46C1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                <p>Or copy this code and use it on the reset page:</p>
                <p><strong>${resetCode}</strong></p>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
        return { success: true, message: 'Password reset email sent' };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, message: 'Failed to send email: ' + error.message };
    }
}

module.exports = { sendSubscribeEmail, sendPasswordResetEmail };

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const { sendSubscribeEmail } = require('../utils/mailer');

const router = express.Router();

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In route
router.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if user exists with same email
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                // Link Google account to existing user
                existingUser.googleId = googleId;
                await existingUser.save();
                user = existingUser;
            } else {
                // Create new user
                user = new User({
                    email,
                    firstName: firstName || 'User',
                    lastName: lastName || '',
                    googleId,
                    isVerified: true, // Google accounts are pre-verified
                });
                await user.save();
            }
        }

        // Return user data (exclude password)
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isLoggedIn: true
        };

        console.log(`✅ Google Login successful for: ${user.email}`);
        res.json({
            success: true,
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('❌ Google auth error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Authentication failed: ' + error.message
        });
    }
});

// Newsletter subscription route
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required'
            });
        }

        // Send notification email to admin (optional)
        try {
            const emailResult = await sendSubscribeEmail(email);
            if (!emailResult.success) {
                console.error('Failed to send subscription email:', emailResult.message);
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError.message);
        }

        // Always return success to user
        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Subscription failed'
        });
    }
});

module.exports = router;
const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Please enter an email'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: false,
            trim: true,
        },
        phone: {
            type: String,
            required: false,
        },
        googleId: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // Allows multiple null values
        },
        password: {
            type: String,
            required: false, // Not required for Google auth
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
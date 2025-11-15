const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: String,
        city: String
    },
    items: [{
        productId: String,
        name: String,
        category: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['mtn', 'airtel'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentReference: String,
    notes: String
}, {
    timestamps: true
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
module.exports = Order;

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // ✅ NEW FIELD: Professional human-readable Order ID (e.g., TM-A4B7D2)
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product',
            required: true 
        },
        name: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String } 
    }],
    shippingAddress: {
        address: { type: String, required: true }, 
        city: { type: String, required: true },
        postalCode: { type: String, required: true }, 
        country: { type: String, default: 'India' },  
        phone: { type: String, required: true }
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0.0
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'online'
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        required: true,
        default: 'Processing',
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled']
    },
    deliveryDeadline: {
        type: Date,
        required: true
    },
    deliveredAt: {
        type: Date
    },
    transactionId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
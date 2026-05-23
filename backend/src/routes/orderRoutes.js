const express = require('express');
const router = express.Router();
// 👇 Yahan maine 'getOrders' aur 'updateOrderStatus' add kiya hai
const { 
    createOrder, 
    getMyOrders, 
    getOrders, 
    updateOrderStatus 
} = require('../controllers/orderController');

const { protect } = require('../middleware/authMiddleware');

// --- User Routes ---
// Order create karne ke liye
router.post('/', protect, createOrder);

// User ko apne orders dekhne ke liye
router.get('/myorders', protect, getMyOrders);

// --- Admin Routes (Jo missing the) ---
// 1. Saare users ke orders lane ke liye (Admin Dashboard)
router.get('/', protect, getOrders); 

// 2. Order ka status badalne ke liye (Ship/Deliver buttons ke liye)
router.put('/:id/:status', protect, updateOrderStatus);

// 3. Approve payment manually
router.put('/:id/approve-payment', protect, async (req, res) => {
    try {
        const order = await require('../models/orderModel').findById(req.params.id);
        if (order) {
            order.paymentStatus = 'Paid';
            await order.save();
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
});

module.exports = router;
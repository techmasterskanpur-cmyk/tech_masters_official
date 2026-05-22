const jwt  = require('jsonwebtoken');
const User = require('../models/userModel');

// ── Admin email whitelist (matches frontend AdminRoute check) ─────────────────
const ADMIN_EMAILS = [
    'alankritasthana12@gmail.com',
    'techmasterskanpur@gmail.com',
];

/**
 * protect
 * Verifies the JWT token and attaches req.user.
 * All protected routes must pass through this first.
 */
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * adminOnly
 * Must be used AFTER protect.
 * Allows access only if the user has role === 'admin'
 * OR their email is in the hardcoded admin whitelist.
 */
exports.adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const isAdminRole  = req.user.role === 'admin';
    const isAdminEmail = ADMIN_EMAILS.includes(
        req.user.email?.toLowerCase().trim()
    );

    if (isAdminRole || isAdminEmail) {
        return next();
    }

    return res.status(403).json({ message: 'Not authorized as admin' });
};
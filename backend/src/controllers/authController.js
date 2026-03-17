const User = require('../models/userModel'); 
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); 
const sendEmail = require('../utils/sendEmail'); // ✅ Imported sendEmail tool

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone, 
                altPhone: user.altPhone, 
                avatar: user.avatar,
                addresses: user.addresses || [],
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone, 
                altPhone: user.altPhone, 
                avatar: user.avatar,
                addresses: user.addresses || [], 
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            
            if (req.body.phone !== undefined) user.phone = req.body.phone;
            if (req.body.altPhone !== undefined) user.altPhone = req.body.altPhone;
            
            if (req.body.password) {
                user.password = req.body.password;
            }

            if (req.body.addresses) {
                user.addresses = req.body.addresses;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone, 
                altPhone: updatedUser.altPhone, 
                avatar: updatedUser.avatar,
                addresses: updatedUser.addresses, 
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body; 
        
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone, 
                altPhone: user.altPhone, 
                avatar: picture, 
                addresses: user.addresses || [], 
                token: generateToken(user._id),
            });
        } else {
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = await User.create({
                name,
                email,
                password: randomPassword,
                avatar: picture
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone, 
                altPhone: user.altPhone, 
                avatar: picture,
                addresses: user.addresses || [],
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ message: 'Google Sign-In Failed', error: error.message });
    }
};

// =================================================================
// ✅ NEW: Forgot Password & OTP Flow
// =================================================================

// @desc    Step 1: Send OTP to User's Email
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account found with that email' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and set a 10-minute expiration timer
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
        await user.save({ validateBeforeSave: false });

        // Email the OTP using your new Nodemailer setup
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563EB; text-align: center; margin-bottom: 20px;">Tech_Masters</h2>
                <p style="font-size: 16px; color: #374151;">Hi ${user.name},</p>
                <p style="font-size: 16px; color: #374151;">We received a request to reset the password for your account. Enter the following 6-digit code to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="background-color: #f3f4f6; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; border-radius: 8px;">${otp}</span>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">This code will expire in exactly 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this password reset, please ignore this email. Your account is safe.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Tech_Masters - Your Password Reset Code',
                message
            });
            res.status(200).json({ message: 'OTP sent to your email' });
        } catch (error) {
            // If email fails, wipe the OTP from the DB for safety
            user.resetPasswordOtp = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Step 2: Verify OTP and Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find user by email, matching OTP, and check if time hasn't expired ($gt = greater than now)
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP code' });
        }

        // Set the new password (your pre-save hook will hash it automatically!)
        user.password = newPassword;
        
        // Wipe the OTP clean so it can't be used again
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const bcrypt = require('bcryptjs');


const jwt    = require('jsonwebtoken');


const { User } = require('../models/index');

const sendEmail = require('../utils/sendEmail');

const crypto = require('crypto');

require('dotenv').config();


// LOGIN
// POST /api/auth/login
// Body: { phone, password }

const login = async (req, res) => {
    try {
        // Request body se phone aur password lo
        const { phone, password } = req.body;

        // Validation - Dono fields required hain
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone and password are required'
            });
        }

        // Database me user dhundho phone number se
        const user = await User.findOne({
            where: { phone: phone.trim() }
        });

        // User nahi mila
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        // Account active hai ya nahi check karo
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account deactivated. Contact admin.'
            });
        }

        // Password check karo
        const isMatch = await bcrypt.compare(password, user.password_hash);

        // Password galat hai
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        // Token banao
        // jwt.sign = New token create karta hai
        const token = jwt.sign(
            // Payload = Token me store karna hai
            { id: user.id, role: user.role },
            // Secret key
            process.env.JWT_SECRET,
            // Options
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id:        user.id,
                full_name: user.full_name,
                phone:     user.phone,
                email:     user.email,
                role:      user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error:   error.message
        });
    }
};


// GET ME (Apni info dekho)
// GET /api/auth/me

const getMe = async (req, res) => {
    try {
        // req.user verifyToken middleware ne set kiya tha
        const user = await User.findByPk(req.user.id, {
            // Password hash mat bhejo
            attributes: {
                exclude: ['password_hash']
            }
        });

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const setPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        //  Validation
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, password and confirmPassword are required'
            });
        }

        //  Password match karo
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and Confirm Password do not match!'
            });
        }

        //  Minimum length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        //  Token se user dhundo
        // invite_token_expiry > abhi ka time (token valid hai)
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                invite_token:        token,
                invite_token_expiry: { [Op.gt]: new Date() }
            }
        });

        // User nahi mila ya token expire ho gaya
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired link! Ask admin to resend invite.'
            });
        }

        //  Password hash karo
        const password_hash = await bcrypt.hash(password, 10);

        //  User update karo
        await user.update({
            password_hash,
            is_password_set:     true,   //  Done
            is_active:           true,   //  Account active
            invite_token:        null,   //  Token delete
            invite_token_expiry: null    //  Expiry delete
        });

        return res.status(200).json({
            success: true,
            message: 'Password set successfully! You can now login.'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// PATCH /api/auth/change-password
// Body: { old_password, new_password }

const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;

        // Validation
        if (!old_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Both old and new passwords are required'
            });
        }

        // New password minimum 6 characters
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Database se user lo (password hash ke saath)
        const user = await User.findByPk(req.user.id);

        // Old password verify karo
        const isMatch = await bcrypt.compare(old_password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Old password is incorrect'
            });
        }

        // New password encrypt karo
        const newHash = await bcrypt.hash(new_password, 10);

        // Database update karo
        await user.update({ password_hash: newHash });

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const resendInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const crypto = require('crypto');

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.is_password_set) {
            return res.status(400).json({
                success: false,
                message: 'User has already set their password!'
            });
        }

        // Naya token banao
        const invite_token = crypto.randomBytes(32).toString('hex');
        const invite_token_expiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        await user.update({ invite_token, invite_token_expiry });

        // Email bhejo agar hai toh
        if (user.email) {
            // sendInviteEmail adminController mein hai
            // Isliye yahan link return kar do
        }

        const inviteLink =
            `${process.env.FRONTEND_URL}/set-password?token=${invite_token}`;

        return res.status(200).json({
            success:     true,
            message:     'New invite link generated!',
            invite_link: inviteLink
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// LOGOUT
// POST /api/auth/logout

const logout = async (req, res) => {
    // JWT stateless hota hai
    // Server pe kuch store nahi hota
    // Frontend token delete kar deta hai
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Google Auth 
// POST /api/auth/google
// Body: { access_token }

const googleAuth = async (req, res) => {
    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Google access token is required'
            });
        }

        // Get user info from Google 
        const googleResponse = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        if (!googleResponse.ok) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token. Please try again.'
            });
        }

        const googleUser = await googleResponse.json();
        const { email, given_name, family_name, sub } = googleUser;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve email from Google.'
            });
        }

        // Find user in DB by email 
        const user = await User.findOne({ where: { email } });

        //  NOT in DB — Block (Option A) 
        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'No account found with this email. Please contact your Admin.'
            });
        }

        // Account deactivated 
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account deactivated. Please contact your Admin.'
            });
        }

        // Account pending — invite not completed 
        if (!user.is_password_set && user.auth_source === 'local') {
            return res.status(403).json({
                success: false,
                message: 'Please complete your account setup first. Check your email for the invite link.'
            });
        }

        // Local user (phone login) — no email login ─
        // User exists but never used Google before
        // Only block if auth_source is strictly 'local' & no google_id
        if (user.auth_source === 'local' && !user.google_id) {
            return res.status(403).json({
                success: false,
                message: 'This account uses phone & password login. Please login with your credentials.'
            });
        }

        //  First time Google login 
        // Save google_id and update auth_source if not already set
        if (!user.google_id) {
            await user.update({
                google_id:   sub,
                auth_source: 'google'
            });
        }

        // genereate jwt 
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                id:        user.id,
                full_name: user.full_name,
                phone:     user.phone,
                email:     user.email,
                role:      user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error:   error.message
        });
    }
};


// Forgot Password 
// POST /api/auth/forgot-password 
// body : { email }
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Always return same generic message (prevent email enumeration)
        const genericMessage =
            'If an account with this email exists, a reset link has been sent.';

        // ── Step 1: Find user ─────────────────────────────────
        const user = await User.findOne({ where: { email } });

        // User not found — return generic (don't reveal)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        // ── Step 2: Generate raw token ────────────────────────
        const rawToken    = crypto.randomBytes(32).toString('hex');

        // ── Step 3: Hash the token (store hash in DB) ─────────
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        // ── Step 4: Set expiry (1 hour from now) ──────────────
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // ── Step 5: Store hashed token in DB ──────────────────
        await user.update({
            reset_password_token:  hashedToken,
            reset_password_expiry: expiry
        });

        // ── Step 6: Send raw token in email link ──────────────
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

        await sendEmail({
            to:      user.email,
            subject: 'Password Reset Request — FieldTrack',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                            padding:28px;border:1px solid #e2e8f0;border-radius:16px;">

                    <h2 style="color:#7c3aed;margin-bottom:8px;">Reset Your Password</h2>

                    <p style="color:#475569;font-size:14px;margin-bottom:4px;">
                        Hi <strong>${user.full_name}</strong>,
                    </p>

                    <p style="color:#475569;font-size:14px;">
                        We received a request to reset your FieldTrack password.
                        Click the button below to create a new password.
                    </p>

                    <p style="color:#94a3b8;font-size:13px;">
                        ⏱ This link expires in <strong>1 hour</strong>.
                    </p>

                    <div style="text-align:center;margin:28px 0;">
                        <a href="${resetURL}"
                           style="background:linear-gradient(135deg,#7c3aed,#a855f7);
                                  color:white;padding:13px 30px;text-decoration:none;
                                  border-radius:10px;font-weight:600;font-size:14px;
                                  display:inline-block;">
                            Reset Password
                        </a>
                    </div>

                    <p style="color:#94a3b8;font-size:12px;">
                        If you didn't request this, you can safely ignore this email.
                        Your password will not change.
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />

                    <p style="color:#94a3b8;font-size:11px;text-align:center;">
                        © ${new Date().getFullYear()} FieldTracking · All rights reserved
                    </p>
                </div>
            `
        });

        return res.status(200).json({
            success: true,
            message: genericMessage
        });

    } catch (error) {

        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
};

// reset password 
// POST /api/auth/reset-password/:token
// Body : { password, confirmPassword}

const resetPassword = async (req, res) => {
    try {
        const { token }                    = req.params;
        const { password, confirmPassword } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirm password are required'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // ── Step 1: Hash the raw token from URL ───────────────
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // ── Step 2: Find user by hashed token + check expiry ──
        const user = await User.findOne({
            where: {
                reset_password_token:  hashedToken,
                reset_password_expiry: { [Op.gt]: new Date() } // not expired
            }
        });

        // Token invalid or expired
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Reset link is invalid or has expired. Please request a new one.'
            });
        }

        // ── Step 3: Hash new password ─────────────────────────
        const password_hash = await bcrypt.hash(password, 10);

        // ── Step 4: Update password & clear token ─────────────
        await user.update({
            password_hash,
            reset_password_token:  null, // one-time use → clear
            reset_password_expiry: null,
            is_password_set:       true,
            is_active:             true,
        });

        // ── Step 5: Send confirmation email ───────────────────
        await sendEmail({
            to:      user.email,
            subject: 'Password Changed Successfully — FieldTrack',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                            padding:28px;border:1px solid #e2e8f0;border-radius:16px;">

                    <h2 style="color:#10b981;margin-bottom:8px;">✓ Password Changed</h2>

                    <p style="color:#475569;font-size:14px;">
                        Hi <strong>${user.full_name}</strong>,
                    </p>

                    <p style="color:#475569;font-size:14px;">
                        Your FieldTrack password has been successfully changed.
                        You can now login with your new password.
                    </p>

                    <p style="color:#ef4444;font-size:13px;">
                        If you did not make this change, please contact your Admin immediately.
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />

                    <p style="color:#94a3b8;font-size:11px;text-align:center;">
                        © ${new Date().getFullYear()} FieldTracking · All rights reserved
                    </p>
                </div>
            `
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now login.'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
};



const updateProfile = async (req, res) => {
    try {
        const { full_name, email, employee_id } = req.body;

        // Validation
        if (!full_name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required'
            });
        }

        // User fetch karo
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Email duplicate check (agar change kiya)
        if (email && email.trim() !== user.email) {
            const { Op } = require('sequelize');
            const emailExists = await User.findOne({
                where: {
                    email: email.trim(),
                    id:    { [Op.ne]: req.user.id }
                }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another account'
                });
            }
        }

        // Update karo
        await user.update({
            full_name:   full_name.trim(),
            email:       email?.trim()       || user.email,
            employee_id: employee_id?.trim() || user.employee_id
        });

        // Updated user return karo
        const updated = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            user:    updated
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = { login, getMe, changePassword, logout, setPassword, resendInvite, googleAuth, forgotPassword, resetPassword, updateProfile };
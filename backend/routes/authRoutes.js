const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/auth');


const authController = require('../controllers/authController');

console.log("verifyToken =", typeof verifyToken);

console.log("login =", typeof authController.login);
console.log("getMe =", typeof authController.getMe);
console.log("changePassword =", typeof authController.changePassword);
console.log("logout =", typeof authController.logout);
console.log("setPassword =", typeof authController.setPassword);
console.log("resendInvite =", typeof authController.resendInvite);


// login route 
// POST /api/auth/login
// body phone, pass
router.post('/login', authController.login);

// protected token 
// get /api/auth/me info

router.get('/me', verifyToken, authController.getMe);

// change password 
router.patch('/change-password', verifyToken, authController.changePassword);

// Logout 
// Post /api/auth/logout 
router.post('/logout', verifyToken, authController.logout);

// set password 
router.post('/set-password', authController.setPassword);


// resend link 

router.post(
    '/resend-invite/:id',
    verifyToken,
    authController.resendInvite
);

router.post('/google', authController.googleAuth);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

router.patch('/update-profile',  verifyToken, authController.updateProfile);



module.exports = router;


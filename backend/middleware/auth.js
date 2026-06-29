const jwt = require('jsonwebtoken');
// jwt library  - for token verify 

const { User } = require('../models/index');
// user model - fetch user from db - users 

require('dotenv').config();



const verifyToken = async (req, res, next) => {
    try {

        // authorization header 
        const authHeader = req.headers['authorization']; 

        // Header does'not exist - login first
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header missing. Please login first.'
            });
        }

        // Header "Bearer TOKEN" should be in format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Use: Bearer <token>'
            });
        }

        // Bearer eyJhbG... → ["Bearer", "eyJhbG..."] - extract token 
        const token = authHeader.split(' ')[1];

        // if token is missing
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is missing'
            });
        }

        // token decode - verify
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            // decoded = { id: 1, role: 'Admin', iat: ..., exp: ... }
        } catch (jwtError) {
            // Token expired ya tampered hai
            return res.status(401).json({
                success: false,
                message: 'Token expired or invalid. Please login again.'
            });
        }


        // load user from db 
        const user = await User.findByPk(decoded.id, {
            // only required these columns 
            attributes: ['id', 'full_name', 'phone', 'role', 'is_active']
        });

        // User doesn't exist
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Account may have been deleted.'
            });
        }

        // User deactivated - active check
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Contact admin.'
            });
        }


        req.user = user;

        // move next middleware or controller 
        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error:   error.message
        });
    }
};


const checkRole = (...roles) => {
    // return a function 
    //  which are actual middleware 
    return (req, res, next) => {

        // req.user set by verifyToken
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login first'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This route is for: ${roles.join(' or ')}`
            });
        }

        //  Role is correct  →  move ahead
        next();
    };
};


const isAdmin = checkRole('Admin');
module.exports = { verifyToken, checkRole, authenticate: verifyToken, isAdmin };



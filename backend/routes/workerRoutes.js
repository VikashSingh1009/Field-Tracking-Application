const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { verifyToken, checkRole } = require('../middleware/auth');
const workerController = require('../controllers/workerController');

// Photo upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `photo_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

//  Worker role check in all routers
router.use(verifyToken);
router.use(checkRole('Worker'));

// Dashboard
router.get('/dashboard', workerController.getDashboard);

// My Tasks
router.get('/tasks',      workerController.getMyTasks);
router.get('/tasks/:id',  workerController.getTaskDetail);

// Task update (status + photos)
router.post('/tasks/:id/update',
    upload.array('photos', 10),
    workerController.updateTask
);

// upload evidence 
router.post('/evidence/upload',
    upload.array('photos', 10),
    workerController.uploadEvidence
);

// My Evidence
router.get('/evidence', workerController.getMyEvidence);

// Notifications
router.get('/notifications',            workerController.getNotifications);
router.patch('/notifications/:id/read', workerController.markNotificationRead);


router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Max size is 5MB per photo'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Max 10 photos allowed'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    if (err.message?.includes('Only JPG')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
});

module.exports = router;
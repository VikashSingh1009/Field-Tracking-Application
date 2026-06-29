const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { verifyToken, checkRole } = require('../middleware/auth');
const supervisorController = require('../controllers/supervisorController');

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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'), false);
        }
    }
});

// Saare routes pe token + Supervisor role check
router.use(verifyToken);
router.use(checkRole('Supervisor'));

// Dashboard
router.get('/dashboard', supervisorController.getDashboard);

// My Locations
router.get('/locations',     supervisorController.getMyLocations);
router.get('/locations/:id', supervisorController.getLocationDetail);  //need to review this route 
//  supervisor b - have access to see 99 id even it is not this 

// My Activities
router.get('/activities',                      supervisorController.getMyActivities);
router.get('/activities/:id',                  supervisorController.getActivityDetail);
router.patch('/activities/:id/assign-worker',  supervisorController.assignWorker);
router.post('/activities/:id/update', upload.array('photos', 10), supervisorController.updateActivity);
// router.patch('/activities/:id/update',         supervisorController.updateActivity);

// Workers list
router.get('/workers', supervisorController.getWorkers);
router.get('/my-workers',        supervisorController.getMyWorkers);     // ✅ My assigned workers
router.get('/workers/:id/tasks', supervisorController.getWorkerTasks); 

// config/routes/supervisorRoutes.js
router.patch(
    '/locations/bulk-assign-worker',
    supervisorController.bulkAssignWorker
);

// Evidence (Photos)
router.get('/evidence',        supervisorController.getEvidence);
router.post('/evidence/upload',
    upload.array('photos', 10), 
    supervisorController.uploadEvidence
);
// router.post('/activities/:id/update', upload.array('photos', 10), supervisorController.updateActivity);


// Notifications
router.get('/notifications',            supervisorController.getNotifications);
router.patch('/notifications/:id/read', supervisorController.markNotificationRead);






const getMyWorkers = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        // Step 1: Supervisor ke assigned workers fetch karo
        const workers = await User.findAll({
            where: {
                role:          'Worker',
                is_active:     true,
                supervisor_id: supervisorId   // ✅ Sirf is supervisor ke workers
            },
            attributes: [
                'id', 'full_name', 'phone',
                'email', 'employee_id', 'is_active'
            ],
            order: [['full_name', 'ASC']]
        });

        // Step 2: Har worker ke liye task stats nikalo
        const workersWithStats = await Promise.all(
            workers.map(async (worker) => {

                // Worker ki saari tasks is supervisor
                // ki locations mein
                const tasks = await LocationActivity.findAll({
                    where: { worker_id: worker.id },
                    include: [{
                        model:    Location,
                        as:       'location',
                        where:    {
                            supervisor_id: supervisorId,
                            is_active:     true
                        },
                        required:   true,
                        attributes: ['id', 'location_name']
                    }, {
                        model:      SubActivity,
                        as:         'activity',
                        attributes: ['activity_name']
                    }],
                    attributes: [
                        'id', 'status', 'progress_pct',
                        'planned_end_date', 'remarks'
                    ]
                });

                // Stats calculate karo
                const total      = tasks.length;
                const completed  = tasks.filter(t => t.status === 'Completed').length;
                const inProgress = tasks.filter(t => t.status === 'In Progress').length;
                const delayed    = tasks.filter(t => t.status === 'Delayed').length;
                const incomplete = tasks.filter(t => t.status === 'Incomplete').length;
                const notStarted = tasks.filter(t => t.status === 'Not Started').length;
                const avgProgress = total > 0
                    ? Math.round(tasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / total)
                    : 0;

                // Overall worker status
                let overallStatus = 'No Tasks';
                if (total > 0) {
                    if (completed === total)   overallStatus = 'All Done';
                    else if (delayed > 0)      overallStatus = 'Has Delays';
                    else if (incomplete > 0)   overallStatus = 'Has Incomplete';
                    else if (inProgress > 0)   overallStatus = 'Active';
                    else                       overallStatus = 'Not Started';
                }

                return {
                    ...worker.toJSON(),
                    stats: {
                        total,
                        completed,
                        in_progress: inProgress,
                        delayed,
                        incomplete,
                        not_started: notStarted,
                        avg_progress: avgProgress,
                        overall_status: overallStatus
                    },
                    recent_tasks: tasks.slice(0, 3) // Preview ke liye 3 tasks
                };
            })
        );

        return res.status(200).json({
            success: true,
            data:    workersWithStats,
            total:   workersWithStats.length
        });

    } catch (error) {
        console.error('[getMyWorkers] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const getWorkerTasks = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const workerId     = parseInt(req.params.id);

        // Worker exist karta hai aur is supervisor
        // ka assigned hai?
        const worker = await User.findOne({
            where: {
                id:            workerId,
                role:          'Worker',
                supervisor_id: supervisorId  // ✅ Security check
            },
            attributes: [
                'id', 'full_name', 'phone',
                'email', 'employee_id', 'is_active'
            ]
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found or not assigned to you'
            });
        }

        // Worker ki saari tasks is supervisor
        // ki locations mein
        const tasks = await LocationActivity.findAll({
            where: { worker_id: workerId },
            include: [
                {
                    model:    Location,
                    as:       'location',
                    where:    {
                        supervisor_id: supervisorId,
                        is_active:     true
                    },
                    required:   true,
                    attributes: [
                        'id', 'location_name',
                        'location_type', 'corridor_name'
                    ]
                },
                {
                    model:      SubActivity,
                    as:         'activity',
                    attributes: ['activity_name']
                },
                {
                    model:   TaskUpdate,
                    as:      'updates',
                    limit:   3,
                    order:   [['created_at', 'DESC']],
                    include: [{
                        model:      User,
                        as:         'updater',
                        attributes: ['full_name']
                    }]
                }
            ],
            order: [['planned_end_date', 'ASC']]
        });

        // Stats
        const total      = tasks.length;
        const completed  = tasks.filter(t => t.status === 'Completed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const delayed    = tasks.filter(t => t.status === 'Delayed').length;
        const incomplete = tasks.filter(t => t.status === 'Incomplete').length;
        const notStarted = tasks.filter(t => t.status === 'Not Started').length;
        const avgProgress = total > 0
            ? Math.round(tasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / total)
            : 0;

        return res.status(200).json({
            success: true,
            worker,
            stats: {
                total,
                completed,
                in_progress: inProgress,
                delayed,
                incomplete,
                not_started: notStarted,
                avg_progress: avgProgress
            },
            data: tasks
        });

    } catch (error) {
        console.error('[getWorkerTasks] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = router;
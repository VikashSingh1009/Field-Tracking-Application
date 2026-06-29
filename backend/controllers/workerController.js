const { Op } = require('sequelize');
const {
    User,
    SubActivity,
    Location,
    LocationActivity,
    TaskUpdate,
    Notification
} = require('../models/index');


const getDashboard = async (req, res) => {
    try {
        const wid = req.user.id;

        // My tasks stats
        const total      = await LocationActivity.count({ where: { worker_id: wid } });
        const completed  = await LocationActivity.count({ where: { worker_id: wid, status: 'Completed' } });
        const inProgress = await LocationActivity.count({ where: { worker_id: wid, status: 'In Progress' } });
        const notStarted = await LocationActivity.count({ where: { worker_id: wid, status: 'Not Started' } });
        const delayed    = await LocationActivity.count({ where: { worker_id: wid, status: 'Delayed' } });

        // Pending tasks (complete nahi hue)
        const pendingTasks = await LocationActivity.findAll({
            where:   {
                worker_id: wid,
                status:    { [Op.ne]: 'Completed' }
            },
            limit:  5,
            order:  [['planned_end_date', 'ASC']],
            include: [
                { model: Location,    as: 'location', attributes: ['location_name', 'location_type'] },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'] }
            ]
        });

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    total,
                    completed,
                    in_progress: inProgress,
                    not_started: notStarted,
                    delayed
                },
                pending_tasks: pendingTasks
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// 2. MY TASKS
// GET /api/worker/tasks?status=

const getMyTasks = async (req, res) => {
    try {
        const { status } = req.query;

        const where = { worker_id: req.user.id };
        if (status) where.status = status;

        const tasks = await LocationActivity.findAll({
            where,
            order:   [['planned_end_date', 'ASC']],
            include: [
                {
                    model:      Location,
                    as:         'location',
                    attributes: ['id', 'location_name', 'location_type'],
                    include:    [{
                        model:      User,
                        as:         'supervisor',
                        attributes: ['full_name', 'phone']
                    }]
                },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'],

                 },
                 {
                    model: User,
                    as: 'worker',
                    attributes: ['id', 'full_name', 'phone']
                 }
            ]
        });

        return res.status(200).json({ success: true, data: tasks });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// 3. TASK DETAIL
// GET /api/worker/tasks/:id

const getTaskDetail = async (req, res) => {
    try {
        const task = await LocationActivity.findOne({
            where:   { id: req.params.id, worker_id: req.user.id },
            include: [
                {
                    model:      Location,
                    as:         'location',
                    attributes: ['location_name', 'location_type'],
                    include:    [{
                        model:      User,
                        as:         'supervisor',
                        attributes: ['full_name', 'phone']
                    }]
                },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                {
                    model:   TaskUpdate,
                    as:      'updates',
                    include: [{
                        model:      User,
                        as:         'updater',
                        attributes: ['full_name']
                    }],
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or not assigned to you'
            });
        }

        return res.status(200).json({ success: true, data: task });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// 4. UPDATE TASK (Status + Photos)
// POST /api/worker/tasks/:id/update
// Form-data: status, progress_pct, remarks, photo_type, photos[]

const updateTask = async (req, res) => {
    try {
        const { status, progress_pct, remarks, photo_type, latitude, longitude, accuracy } = req.body;

        // Task dhundho aur verify karo
        const task = await LocationActivity.findOne({
            where:   { id: req.params.id, worker_id: req.user.id },
            include: [{
                model:      Location,
                as:         'location',
                attributes: ['location_name','supervisor_id']
            }, {
                model: SubActivity,
                as: 'activity',
                attributes: ['activity_name']
            }]
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or not assigned to you'
            });
        }

        // Old values history ke liye
        const oldStatus   = task.status;
        const oldProgress = task.progress_pct;

        // Photos handle karo
        let photoUrls = null;
        if (req.files && req.files.length > 0) {
            photoUrls = req.files.map(f => `/uploads/${f.filename}`);
        }

        // Task update karo
        await task.update({
            status:       status       || task.status,
            progress_pct: progress_pct ?? task.progress_pct,
            remarks:      remarks      || task.remarks,

            // Pehli baar In Progress hua toh actual start date set karo
            actual_start_date: (
                !task.actual_start_date && status === 'In Progress'
                    ? new Date()
                    : task.actual_start_date
            ),

            // Completed hua toh actual end date set karo
            actual_end_date: (
                status === 'Completed' ? new Date() : task.actual_end_date
            )
        });

        // History record banao
        await TaskUpdate.create({
            location_activity_id: task.id,
            updated_by:           req.user.id,
            old_status:           oldStatus,
            new_status:           status       || oldStatus,
            old_progress:         oldProgress,
            new_progress:         progress_pct ?? oldProgress,
            remarks:              remarks      || null,
            photos:               photoUrls,   // JSON array ya null
            photo_type:           photo_type   || null,
            latitude:  latitude  ? parseFloat(latitude)  : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        // Supervisor ko notification bhejo
        if (task.location?.supervisor_id) {
            await Notification.create({
                to_user_id:     task.location.supervisor_id,
                from_user_id:   req.user.id,
                type:           'Status Updated',
                title:          'Task Progress Updated',
                message:        `${req.user.full_name} updated task: ${status || oldStatus} (${progress_pct ?? oldProgress}%)`,
                reference_id:   task.id,
                reference_type: 'location_activity'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            gps_captured:  !!(latitude && longitude),
            photos_saved:  photoUrls ? photoUrls.length : 0
        });

    } catch (error) {
        console.error('updateTask error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


// my evidence

const getMyEvidence = async (req, res) => {
    try {
        const { photo_type } = req.query;

        //build filter
        const where = {
            updated_by: req.user.id,
            photos:     { [Op.ne]: null }
        };

        // Optional: filter by photo type
        if (photo_type) where.photo_type = photo_type;

        const evidence = await TaskUpdate.findAll({
            where,
            order: [['created_at', 'DESC']],
            include: [
                // add this 
                {
                    model:      User,
                    as:         'updater',
                    attributes: ['id', 'full_name']
                },
                {
                    model:   LocationActivity,
                    as:      'location_activity',
                    include: [
                        {
                            model:      Location,
                            as:         'location',
                            attributes: ['id', 'location_name', 'corridor_name']
                        },
                        {
                            model:      SubActivity,
                            as:         'activity',
                            attributes: ['activity_name']
                        }
                    ]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            count:   evidence.length,
            data:    evidence
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 6. GET NOTIFICATIONS

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where:   { to_user_id: req.user.id },
            order:   [['created_at', 'DESC']],
            limit:   50,
            include: [{ model: User, as: 'sender', attributes: ['full_name'] }]
        });

        const unreadCount = await Notification.count({
            where: { to_user_id: req.user.id, is_read: false }
        });

        return res.status(200).json({
            success:      true,
            unread_count: unreadCount,
            data:         notifications
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// ADD this new function after getMyEvidence()
// This allows worker to upload ONLY photos
// without changing task status

const uploadEvidence = async (req, res) => {
    try {
        const {
            location_activity_id,
            photo_type,
            remarks,
            latitude,    
            longitude,   
            accuracy     
        } = req.body;

        // validation 
        if (!location_activity_id) {
            return res.status(400).json({
                success: false,
                message: 'location_activity_id is required'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one photo'
            });
        }

        // Verify task is assigned to this worker 
        const task = await LocationActivity.findOne({
            where: {
                id:        location_activity_id,
                worker_id: req.user.id   // Security check
            },
            include: [{
                model:      Location,
                as:         'location',
                attributes: ['location_name', 'supervisor_id']
            }, {
                model:      SubActivity,
                as:         'activity',
                attributes: ['activity_name']
            }]
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or not assigned to you'
            });
        }

        //Build photo URLs
        const photoUrls = req.files.map(f => `/uploads/${f.filename}`);

        //  Save evidence WITHOUT changing task status 
        const update = await TaskUpdate.create({
            location_activity_id: parseInt(location_activity_id),
            updated_by:           req.user.id,
            old_status:           task.status,    
            new_status:           task.status,    
            old_progress:         task.progress_pct,
            new_progress:         task.progress_pct,
            remarks:              remarks   || null,
            photos:               photoUrls,
            photo_type:           photo_type || 'During',

            // gps
            latitude:  latitude  ? parseFloat(latitude)  : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        // notify supervisor 
        if (task.location?.supervisor_id) {
            await Notification.create({
                to_user_id:     task.location.supervisor_id,
                from_user_id:   req.user.id,
                type:           'Evidence Uploaded',
                title:          'New Evidence Uploaded',
                message:        `${req.user.full_name} uploaded ${photoUrls.length} photo(s) for "${task.activity?.activity_name || 'activity'}" at ${task.location?.location_name || 'location'}`,
                reference_id:   update.id,
                reference_type: 'task_update'
            });
        }

        return res.status(201).json({
            success:        true,
            message:        'Evidence uploaded successfully',
            photos:         photoUrls,
            photos_count:   photoUrls.length,
            gps_captured:   !!(latitude && longitude),
            activity_name:  task.activity?.activity_name,
            location_name:  task.location?.location_name
        });

    } catch (error) {
        console.error('uploadEvidence error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 7. MARK NOTIFICATION READ

const markNotificationRead = async (req, res) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { id: req.params.id, to_user_id: req.user.id } }
        );
        return res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboard,
    getMyTasks,
    getTaskDetail,
    updateTask,
    getMyEvidence,
    uploadEvidence,
    getNotifications,
    markNotificationRead
};
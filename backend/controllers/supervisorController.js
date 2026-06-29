'use strict';

const { Op } = require('sequelize');
// const bcryptLib = require('bcryptjs');

const {
    User,
    Phase,
    Vendor,
    SubActivity,
    Location,
    LocationActivity,
    TaskUpdate,
    Notification
} = require('../models/index');

// Helper: Notification
const createNotification = async (toUserId, fromUserId, type, title, message, referenceId, referenceType) => {
    try {
        await Notification.create({
            to_user_id: toUserId, from_user_id: fromUserId,
            type, title, message,
            reference_id: referenceId || null,
            reference_type: referenceType || null
        });
    } catch (err) { console.error('Notification error:', err.message); }
};

// Helper: Update Location Progress
const updateLocationProgress = async (locationId) => {
    try {
        const acts = await LocationActivity.findAll({ where: { location_id: locationId } });
        const total = acts.length;
        if (total === 0) return;
        const completed = acts.filter(function(a) { return a.status === 'Completed'; }).length;
        const inProgress = acts.filter(function(a) { return a.status === 'In Progress'; }).length;
        const pct = Math.round((completed / total) * 100);
        var status = 'Not Started';
        if (completed === total) status = 'Completed';
        else if (inProgress > 0 || completed > 0) status = 'In Progress';
        await Location.update(
            { overall_progress: pct, overall_status: status },
            { where: { id: locationId } }
        );
    } catch (e) { console.error('Progress update error:', e.message); }
};

// 1. Dashboard
const getDashboard = async (req, res) => {
    try {
        const sid = req.user.id;

        // ── Stats — UNCHANGED ────────────────────────
        const myLocations = await Location.count({
            where: { supervisor_id: sid, is_active: true }
        });

        const totalActivities = await LocationActivity.count({
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid },
                required: true
            }]
        });

        const completed = await LocationActivity.count({
            where: { status: 'Completed' },
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid },
                required: true
            }]
        });

        const inProgress = await LocationActivity.count({
            where: { status: 'In Progress' },
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid },
                required: true
            }]
        });

        const delayed = await LocationActivity.count({
            where: { status: 'Delayed' },
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid },
                required: true
            }]
        });

        const notStarted = await LocationActivity.count({
            where: { status: 'Not Started' },
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid },
                required: true
            }]
        });

        // ✅ FIX 1 — Unassigned count sahi se
        const unassigned = await LocationActivity.count({
            where: { worker_id: null },
            include: [{
                model:    Location,
                as:       'location',
                where:    { supervisor_id: sid, is_active: true },
                required: true
            }]
        });

        // ✅ FIX 2 — pendingAssignments mein
        // worker + activity + location sab include karo
        const pendingAssignments = await LocationActivity.findAll({
            where: {
                worker_id: null,
                status:    { [Op.ne]: 'Completed' }
            },
            limit: 10,
            order: [['id', 'ASC']],
            include: [
                {
                    model:    Location,
                    as:       'location',
                    where:    { supervisor_id: sid, is_active: true },
                    required: true,
                    attributes: ['id', 'location_name', 'location_type']
                },
                {
                    model:      SubActivity,
                    as:         'activity',
                    attributes: ['activity_name']
                }
            ]
        });

        // ✅ FIX 3 — Recent Updates add karo
        // Supervisor ke locations ki recent task updates
        const recentUpdates = await TaskUpdate.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model:      User,
                    as:         'updater',
                    attributes: ['full_name']
                },
                {
                    model:   LocationActivity,
                    as:      'location_activity',
                    required: true,
                    include: [
                        {
                            model:    Location,
                            as:       'location',
                            where:    { supervisor_id: sid },
                            required: true,
                            attributes: ['location_name']
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
            data: {
                stats: {
                    my_locations:     myLocations,
                    total_activities: totalActivities,
                    completed,
                    in_progress:      inProgress,
                    delayed,
                    not_started:      notStarted,
                    unassigned
                },
                // ✅ FIX 4 — Dono return karo
                pending_assignments: pendingAssignments,
                recent_updates:      recentUpdates
            }
        });

    } catch (error) {
        console.error('[Supervisor getDashboard]', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 2. My Locations
const getMyLocations = async (req, res) => {
    try {
        const locations = await Location.findAll({
            where: { supervisor_id: req.user.id, is_active: true },
            order: [['serial_number', 'ASC']],
            include: [
                { model: Phase, as: 'phase', attributes: ['phase_name'] },
                { model: Vendor, as: 'vendor', attributes: ['vendor_name'] },
                {
                    model: LocationActivity,
                    as: 'activities',
                    attributes: ['id', 'status', 'progress_pct'],
                    required: false
                }
            ]
            });
        return res.status(200).json({ success: true, data: locations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Location Detail
const getLocationDetail = async (req, res) => {
    try {
        const location = await Location.findOne({
            where: { id: req.params.id, supervisor_id: req.user.id },
            include: [
                { model: Phase, as: 'phase', attributes: ['phase_name'] },
                { model: Vendor, as: 'vendor', attributes: ['vendor_name'] },
                {
                    model: LocationActivity, as: 'activities',
                    include: [
                        { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                        { model: User, as: 'worker', attributes: ['id', 'full_name', 'phone'] }
                    ]
                }
            ]
        });

        if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
        return res.status(200).json({ success: true, data: location });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. My Activities
const getMyActivities = async (req, res) => {
    try {
        var actWhere = {};
        if (req.query.status) actWhere.status = req.query.status;
        if (req.query.location_id) actWhere.location_id = req.query.location_id;

        const activities = await LocationActivity.findAll({
            where: actWhere,
            include: [
                { model: Location, as: 'location', where: { supervisor_id: req.user.id }, required: true, attributes: ['id', 'location_name'] },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                { model: User, as: 'worker', attributes: ['id', 'full_name'] }
            ],
            order: [['id', 'ASC']]
        });

        return res.status(200).json({ success: true, data: activities });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Activity Detail
const getActivityDetail = async (req, res) => {
    try {
        const activity = await LocationActivity.findOne({
            where: { id: req.params.id },
            include: [
                { model: Location, as: 'location', where: { supervisor_id: req.user.id }, required: true, attributes: ['location_name'] },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                { model: User, as: 'worker', attributes: ['full_name', 'phone'] },
                {
                    model: TaskUpdate, as: 'updates',
                    include: [{ model: User, as: 'updater', attributes: ['full_name'] }],
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
        return res.status(200).json({ success: true, data: activity });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Assign Worker
const assignWorker = async (req, res) => {
    try {
        var worker_id = req.body.worker_id;
        var worker_instructions = req.body.worker_instructions;

        if (!worker_id) return res.status(400).json({ success: false, message: 'worker_id required' });

        const worker = await User.findOne({ where: { id: worker_id, role: 'Worker', is_active: true } });
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

        const actInfo = await LocationActivity.findOne({
            where: { id: req.params.id },
            include: [
                { model: Location, as: 'location', where: { supervisor_id: req.user.id }, required: true },
                { model: SubActivity, as: 'activity', attributes: ['activity_name'] }
            ]
        });

        if (!actInfo) return res.status(404).json({ success: false, message: 'Activity not found' });

        var updateData = {
            worker_id: worker_id,
            worker_assigned_at: new Date()
        };
        if (worker_instructions) updateData.worker_instructions = worker_instructions;
        if (actInfo.status === 'Not Started') updateData.status = 'In Progress';

        await actInfo.update(updateData);

        // Update location progress
        await updateLocationProgress(actInfo.location_id);

        await createNotification(
            worker_id, req.user.id,
            'Task Assigned', 'New Task Assigned',
            (actInfo.activity ? actInfo.activity.activity_name : 'Task') + ' at ' + (actInfo.location ? actInfo.location.location_name : 'Location'),
            actInfo.id, 'location_activity'
        );

        return res.status(200).json({ success: true, message: 'Worker "' + worker.full_name + '" assigned successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// 7. Update Activity
const updateActivity = async (req, res) => {
    try {
        var status = req.body.status;
        var progress_pct = req.body.progress_pct;
        var remarks = req.body.remarks;
        var photo_type = req.body.photo_type;

        const activity = await LocationActivity.findOne({
            where: { id: req.params.id },
            include: [{ model: Location, as: 'location', where: { supervisor_id: req.user.id }, required: true }]
        });

        if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

        var oldStatus = activity.status;
        var oldProgress = activity.progress_pct;

        var updateData = {};
        if (status) updateData.status = status;
        if (progress_pct !== undefined && progress_pct !== null) updateData.progress_pct = parseInt(progress_pct);
        if (remarks) updateData.remarks = remarks;
        if (status === 'Completed') updateData.actual_end_date = new Date();

        await activity.update(updateData);


        var photoUrls = [];
        if(req.files && req.files.length > 0) {
            photoUrls = req.files.map(function(f) {
                return '/uploads/' + f.filename;
            });
        }

        await TaskUpdate.create({
            location_activity_id: activity.id,
            updated_by: req.user.id,
            old_status: oldStatus,
            new_status: status || oldStatus,
            old_progress: oldProgress,
            // new_progress: progress_pct !== undefined ? parseInt(progress_pct) : oldProgress,
            new_progress: progress_pct ?? oldProgress,
            remarks: remarks || null,
            photos: photoUrls.length > 0 ? photoUrls : null,
            photo_type: photo_type || null 
        });

        // Update location progress
        await updateLocationProgress(activity.location_id);

        return res.status(200).json({ success: true, message: 'Activity updated',
        photos_uploaded: photoUrls.length
        });
        
    } catch (error) {
        console.error('updateActivity error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Get Workers
const getWorkers = async (req, res) => {
    try {
        const workers = await User.findAll({
            where: { role: 'Worker', is_active: true },
            attributes: ['id', 'full_name', 'phone', 'employee_id'],
            order: [['full_name', 'ASC']]
        });
        return res.status(200).json({ success: true, data: workers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 9. Get Evidence
const getEvidence = async (req, res) => {
    try {
        const evidence = await TaskUpdate.findAll({
            where: { photos: { [Op.ne]: null } },
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'updater', attributes: ['full_name'] },
                {
                    model: LocationActivity, as: 'location_activity',
                    include: [
                        { model: Location, as: 'location', where: { supervisor_id: req.user.id }, required: true, attributes: ['location_name'] },
                        { model: SubActivity, as: 'activity', attributes: ['activity_name'] }
                    ]
                }
            ]
        });
        return res.status(200).json({ success: true, data: evidence });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 10. Upload Evidence
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

        if (!location_activity_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'location_activity_id required' 
            });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Upload at least one photo' 
            });
        }

        var photoUrls = req.files.map(function(f) { 
            return '/uploads/' + f.filename; 
        });

        // const current = await LocationActivity.findByPk(location_activity_id);
        const current = await LocationActivity.findOne({
            where: { id: location_activity_id },
            include: [{
            model:    Location,
            as:       'location',
            where:    { supervisor_id: req.user.id },  //  Check ownership
            required: true,
            attributes: ['id', 'location_name', 'supervisor_id']
            }, {
                model: SubActivity,
                as: 'activity',
                attributes: ['activity_name']
            }]
        });
        if (!current) {
            return res.status(404).json({ 
                success: false, 
                message: 'Activity not found or access denied' 
            });
        }
        await TaskUpdate.create({
            location_activity_id: parseInt(location_activity_id),
            updated_by: req.user.id,
            old_status: current.status,
            new_status: current.status,
            old_progress: current.progress_pct,
            new_progress: current.progress_pct,
            remarks: remarks || null,
            photos: photoUrls,
            photo_type: photo_type || 'During',
            latitude:  latitude  ? parseFloat(latitude)  : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        const adminUsers = await User.findAll({
            where: { role: 'Admin', is_active: true },
            attributes: ['id']
        });

        for (const admin of adminUsers) {
            await createNotification(
                admin.id,
                req.user.id,
                'Evidence Uploaded',
                'New Evidence Uploaded',
                `${req.user.full_name} uploaded ${photoUrls.length} photo(s) for ${current.location?.location_name || 'a location'}`,
                update.id,
                'task_update'
            );
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Evidence uploaded', 
            photos: photoUrls ,
            photos_count:    photoUrls.length,
            gps_captured:    !!(latitude && longitude),
            location_name:   current.location?.location_name,
            activity_name:   current.activity?.activity_name
        });
    } catch (error) {
        console.error('uploadEvidence error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// 11. Notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { to_user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50,
            include: [{ model: User, as: 'sender', attributes: ['full_name'] }]
        });

        const unreadCount = await Notification.count({
            where: { to_user_id: req.user.id, is_read: false }
        });

        return res.status(200).json({ success: true, unread_count: unreadCount, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 12. Mark Read
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

const getMyWorkers = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        const workers = await User.findAll({
            where: {
                role:          'Worker',
                is_active:     true,
                supervisor_id: supervisorId
            },
            attributes: [
                'id', 'full_name', 'phone',
                'email', 'employee_id', 'is_active'
            ],
            order: [['full_name', 'ASC']]
        });

        const workersWithStats = await Promise.all(
            workers.map(async (worker) => {

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

                const total      = tasks.length;
                const completed  = tasks.filter(t => t.status === 'Completed').length;
                const inProgress = tasks.filter(t => t.status === 'In Progress').length;
                const delayed    = tasks.filter(t => t.status === 'Delayed').length;
                const incomplete = tasks.filter(t => t.status === 'Incomplete').length;
                const notStarted = tasks.filter(t => t.status === 'Not Started').length;
                const avgProgress = total > 0
                    ? Math.round(
                        tasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / total
                      )
                    : 0;

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
                    recent_tasks: tasks.slice(0, 3)
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

// ════════════════════════════════════════════
// ✅ NEW FUNCTION 2 — Get Worker Tasks
// GET /supervisor/workers/:id/tasks
// ════════════════════════════════════════════
const getWorkerTasks = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const workerId     = parseInt(req.params.id);

        const worker = await User.findOne({
            where: {
                id:            workerId,
                role:          'Worker',
                supervisor_id: supervisorId
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

        const total      = tasks.length;
        const completed  = tasks.filter(t => t.status === 'Completed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const delayed    = tasks.filter(t => t.status === 'Delayed').length;
        const incomplete = tasks.filter(t => t.status === 'Incomplete').length;
        const notStarted = tasks.filter(t => t.status === 'Not Started').length;
        const avgProgress = total > 0
            ? Math.round(
                tasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / total
              )
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



// ✅ NEW - Bulk Assign Worker to Multiple Locations
const bulkAssignWorker = async (req, res) => {
    try {
        const { locationIds, worker_id } = req.body;
        const supervisor_id = req.user.id;

        // Validation
        if (!locationIds || !locationIds.length) {
            return res.status(400).json({
                success: false,
                message: 'locationIds array required'
            });
        }
        if (!worker_id) {
            return res.status(400).json({
                success: false,
                message: 'worker_id required'
            });
        }

        // Worker exist karta hai?
        const worker = await User.findOne({
            where: {
                id: worker_id,
                role: 'Worker',
                is_active: true
            }
        });
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found or inactive'
            });
        }

        // Verify karein ki ye saari locations 
        // is Supervisor ki hi hain
        const myLocations = await Location.findAll({
            where: {
                id: { [Op.in]: locationIds },
                supervisor_id: supervisor_id,
                is_active: true
            }
        });

        if (myLocations.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No valid locations found'
            });
        }

        // Verified location IDs
        const validLocationIds = myLocations.map(l => l.id);

        // In locations ki saari activities 
        // pe worker assign karo
        const activities = await LocationActivity.findAll({
            where: {
                location_id: { [Op.in]: validLocationIds }
            }
        });

        // Har activity update karo
        let assignedCount = 0;
        for (const activity of activities) {
            await activity.update({
                worker_id: worker_id,
                worker_assigned_at: new Date(),
                status: activity.status === 'Not Started'
                    ? 'In Progress'
                    : activity.status
            });
            assignedCount++;
        }

        // Har location ka progress update karo
        for (const locId of validLocationIds) {
            await updateLocationProgress(locId);
        }

        // Worker ko notification bhejo
        await createNotification(
            worker_id,
            supervisor_id,
            'Task Assigned',
            'New Tasks Assigned',
            `You have been assigned to ${validLocationIds.length} locations`,
            null,
            'bulk_assignment'
        );

        return res.status(200).json({
            success: true,
            message: `Worker "${worker.full_name}" assigned to ${validLocationIds.length} locations (${assignedCount} activities)`
        });

    } catch (error) {
        console.error('bulkAssignWorker error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getMyLocations,
    getLocationDetail,
    getMyActivities,
    getActivityDetail,
    assignWorker,
    updateActivity,
    getWorkers,
    getEvidence,
    uploadEvidence,
    getNotifications,
    markNotificationRead,
    bulkAssignWorker,
    getMyWorkers,
    getWorkerTasks
};
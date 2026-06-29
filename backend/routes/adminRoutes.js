

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');

// Middleware
const { verifyToken, checkRole } = require('../middleware/auth');

// Controller
const adminController = require('../controllers/adminController');
const masterController = require('../controllers/masterLookupController');

// MULTER SETUP (File Upload ke liye)
//
// Multer = File upload handle karne wali library

const storage = multer.diskStorage({

    // File kahan save karo
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },

    // File ka naam kya rakho
    filename: (req, file, cb) => {
        // Unique naam banao = "excel_" + timestamp + extension
        const uniqueName = `excel_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter = Sirf Excel files allow karo
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Sirf .xlsx ya .xls allow karo
    if (ext === '.xlsx' || ext === '.xls') {
        cb(null, true);  // Allow
    } else {
        cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
};

// Multer instance banao
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024  // Max 10MB
    }
});

// ✅ Add BEFORE router.use(verifyToken)
router.get('/sync-phases', async (req, res) => {
    try {
        const { Phase, MasterLookup } = require('../models/index');

        // ✅ Use correct category 'phase_type'
        const allMasterPhases = await MasterLookup.findAll({
            where: { category: 'phase_type' },  // ✅ Fixed!
            raw:   true
        });

        const existingPhases = await Phase.findAll({ raw: true });
        const existingNames  = existingPhases.map(p => 
            p.phase_name.toLowerCase().trim()
        );

        let added = 0;
        const results = [];

        for (const mp of allMasterPhases) {
            const labelLower = mp.label.toLowerCase().trim();

            if (!existingNames.includes(labelLower)) {
                try {
                    await Phase.create({ phase_name: mp.label.trim() });
                    added++;
                    results.push({ status: '✅ ADDED', name: mp.label });
                } catch (err) {
                    results.push({ 
                        status: '❌ FAILED', 
                        name:   mp.label, 
                        error:  err.message 
                    });
                }
            } else {
                results.push({ status: '⏭️ ALREADY_EXISTS', name: mp.label });
            }
        }

        const finalPhases = await Phase.findAll({ 
            order: [['phase_name', 'ASC']],
            raw:   true 
        });

        return res.status(200).json({
            success:           true,
            message:           `Sync done! Added ${added} phases`,
            sync_results:      results,
            phases_after_sync: finalPhases,
            total:             finalPhases.length
        });

    } catch (e) {
        return res.status(500).json({ 
            success: false, 
            message: e.message 
        });
    }
});

router.get('/sync-vendors', async (req, res) => {
    try {
        const { Vendor, MasterLookup } = require('../models/index');

        // ✅ Use correct category 'vendor_type'
        const allMasterVendors = await MasterLookup.findAll({
            where: { category: 'vendor_type' },
            raw:   true
        });

        const existingVendors = await Vendor.findAll({ raw: true });
        const existingNames   = existingVendors.map(v =>
            v.vendor_name.toLowerCase().trim()
        );

        let added = 0;
        const results = [];

        for (const mv of allMasterVendors) {
            const labelLower = mv.label.toLowerCase().trim();

            if (!existingNames.includes(labelLower)) {
                try {
                    await Vendor.create({ vendor_name: mv.label.trim() });
                    added++;
                    results.push({ status: '✅ ADDED', name: mv.label });
                } catch (err) {
                    results.push({
                        status: '❌ FAILED',
                        name:   mv.label,
                        error:  err.message
                    });
                }
            } else {
                results.push({ 
                    status: '⏭️ ALREADY_EXISTS', 
                    name:   mv.label 
                });
            }
        }

        const finalVendors = await Vendor.findAll({
            order: [['vendor_name', 'ASC']],
            raw:   true
        });

        return res.status(200).json({
            success:            true,
            message:            `Sync done! Added ${added} vendors`,
            sync_results:       results,
            vendors_after_sync: finalVendors,
            total:              finalVendors.length
        });

    } catch (e) {
        return res.status(500).json({
            success: false,
            message: e.message
        });
    }
});


// APPLY MIDDLEWARE TO ALL ADMIN ROUTES
// Har route pe token aur role check hoga

router.use(verifyToken);        // Token check karo
router.use(checkRole('Admin')); // Sirf Admin allow

// 
// DASHBOARD

router.get('/dashboard', adminController.getDashboard);


// EXCEL UPLOAD
// upload.single('file') = Ek file accept karo
// 'file' = Frontend me field ka naam

router.post('/upload/excel',   upload.single('file'), adminController.uploadExcel);

router.get('/upload/history',  adminController.getUploadHistory);
router.get('/upload/:id/view', adminController.viewUploadData);

router.get('/notifications',            adminController.getNotifications);
router.patch('/notifications/read-all', adminController.markAllNotificationsRead);
router.patch('/notifications/:id/read', adminController.markNotificationRead);


// USER MANAGEMENT

router.get('/users',                     adminController.getUsers);
router.post('/users',                    adminController.createUser);
router.put('/users/:id',                 adminController.updateUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id',              adminController.deleteUser);


router.patch('/users/:id/reset-password', adminController.resetPassword);


// new - worker - supervisor Assignment Routes 
router.post('/users/:id/assign-supervisor',   adminController.assignWorkerToSupervisor);
router.delete('/users/:id/remove-supervisor', adminController.removeWorkerFromSupervisor);
router.post('/users/bulk-assign',             adminController.bulkAssignWorkers);
router.get('/supervisors-with-workers',       adminController.getSupervisorsWithWorkers);
router.get('/unassigned-workers',             adminController.getUnassignedWorkers);

// LOCATION MANAGEMENT

router.get('/locations',                         adminController.getLocations);
router.get('/locations/:id',                     adminController.getLocationDetail);
router.patch('/locations/:id/assign-supervisor', adminController.assignSupervisor);

// location crud 
router.post('/locations', adminController.createLocation);
router.get('/locations/:id', adminController.getLocationDetail);
router.put('/locations/:id', adminController.updateLocation)
router.delete('/locations/:id', adminController.deleteLocation);  
router.patch('/locations/:id/assign-supervisor', adminController.assignSupervisor);


// ACTIVITIES MASTER

router.get('/activities',        adminController.getActivities);
router.post('/activities',       adminController.createActivity);
router.put('/activities/:id',    adminController.updateActivity);
router.delete('/activities/:id', adminController.deleteActivity);


// Add POST /admin/vendors route
router.post('/vendors', async (req, res) => {
    try {
        const { Vendor } = require('../models/index');
        const { vendor_name } = req.body;

        if (!vendor_name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'vendor_name is required'
            });
        }

        // Duplicate check
        const existing = await Vendor.findOne({
            where: { vendor_name: vendor_name.trim() }
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Vendor "${vendor_name.trim()}" already exists`
            });
        }

        const vendor = await Vendor.create({
            vendor_name: vendor_name.trim()
        });

        return res.status(201).json({
            success: true,
            message: `Vendor "${vendor.vendor_name}" created!`,
            data:    vendor
        });
    } catch (e) {
        return res.status(500).json({ 
            success: false, 
            message: e.message 
        });
    }
});


// REPORTS

router.get('/reports',        adminController.getReports);
router.get('/reports/export', adminController.exportReports);


// EVIDENCE (Photos)

router.get('/evidence', adminController.getEvidence);





// Frontend ko Phase, Vendor, Supervisor list chahiye
// Taaki Create/Edit Location form me dropdowns fill ho sakein

// GET all phases (for dropdown)
router.get('/phases', async (req, res) => {
    try {
        const { Phase } = require('../models/index');
        const phases = await Phase.findAll({
            order: [['phase_name', 'ASC']],
            attributes: ['id', 'phase_name']
        });
        return res.status(200).json({ success: true, data: phases });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// create 
router.post('/phases', async (req, res) => {
    try{
        const { Phase } = require('../models/index');
        const { phase_name } = req.body;

        if(!phase_name?.trim()){
            return res.status(400).json({
                success: false,
                message: 'phase_name is required'
            });
        }

        //duplicate check 
        const exisiting = await Phase.findOne({
            where: {
                phase_name: phase_name.trim()
            }
        });

        if(existing){
            return res.status(409).json({
                success: false,
                message: `Phase "${phase_name.trim()}" already exists`
            });
        }

        const phase = await Phase.create({
            phase_name: phase_name.trim()
        });

        return res.status(201).json({
            success: true,
            message: `Phase "${phase.phase_name}" created successfully`,
            data: phase
        })
    } catch (e){
        return res.status(500).json({
            success: false,
            message: e.message 
        })
    }
});

// update 
router.put('/phases/:id', async (req, res) => {
    try {
        const { Phase } = require('../models/index');
        const { phase_name } = req.body;

        const phase = await Phase.findByPk(req.params.id);
        if (!phase) {
            return res.status(404).json({
                success: false,
                message: 'Phase not found'
            });
        }

        await phase.update({ phase_name: phase_name.trim() });

        return res.status(200).json({
            success: true,
            message: 'Phase updated successfully',
            data:    phase
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// delete 
router.delete('/phases/:id', async (req, res) => {
    try {
        const { Phase } = require('../models/index');

        const phase = await Phase.findByPk(req.params.id);
        if (!phase) {
            return res.status(404).json({
                success: false,
                message: 'Phase not found'
            });
        }

        await phase.destroy();

        return res.status(200).json({
            success: true,
            message: `Phase "${phase.phase_name}" deleted`
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});





// GET all vendors (for dropdown)
router.get('/vendors', async (req, res) => {
    try {
        const { Vendor } = require('../models/index');
        const vendors = await Vendor.findAll({
            order: [['vendor_name', 'ASC']],
            attributes: ['id', 'vendor_name']
        });
        return res.status(200).json({ success: true, data: vendors });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET all supervisors (for dropdown)
router.get('/supervisors', async (req, res) => {
    try {
        const { User } = require('../models/index');
        const supervisors = await User.findAll({
            where:      { role: 'Supervisor', is_active: true },
            order:      [['full_name', 'ASC']],
            attributes: ['id', 'full_name', 'phone']
        });
        return res.status(200).json({ success: true, data: supervisors });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});


// master managment 
router.get('/masters',              masterController.getMasters);
router.get('/masters/:category',    masterController.getMastersByCategory);
router.post('/masters',             masterController.createMaster);
router.put('/masters/:id',          masterController.updateMaster);
router.delete('/masters/:id',       masterController.deleteMaster);
router.patch('/masters/:id/toggle', masterController.toggleMasterStatus);


// NOTIFICATIONS



module.exports = router;
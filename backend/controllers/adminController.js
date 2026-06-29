'use strict';

const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const XLSX   = require('xlsx');
const path   = require('path');
const fs     = require('fs');
const { Op } = require('sequelize');
const { Sequelize, sequelize } = require('../config/database');


const {
    User,
    Phase,
    Vendor,
    ExcelUpload,
    SubActivity,
    Location,
    LocationActivity,
    TaskUpdate,
    Notification
} = require('../models/index');


const createNotification = async (
    toUserId, fromUserId, type,
    title, message, referenceId, referenceType
) => {
    try {
        await Notification.create({
            to_user_id:     toUserId,
            from_user_id:   fromUserId,
            type,
            title,
            message,
            reference_id:   referenceId   || null,
            reference_type: referenceType || null
        });
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

const parseExcelDate = (value) => {
    if (!value) return null;
    try {
        if (typeof value === 'number') {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (parsed) {
                const m = String(parsed.m).padStart(2, '0');
                const d = String(parsed.d).padStart(2, '0');
                return `${parsed.y}-${m}-${d}`;
            }
        }
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        return null;
    } catch (e) {
        return null;
    }
};

const mapStatus = (value) => {
    if (!value) return 'Not Started';
    const v = value.toString().toLowerCase().trim();
    if (['done', 'completed', 'complete', 'yes'].includes(v)) return 'Completed';
    if (['wip', 'in progress', 'inprogress', 'ongoing'].includes(v)) return 'In Progress';
    if (['hold', 'on hold', 'onhold'].includes(v)) return 'On Hold';
    if (['delayed', 'delay', 'late'].includes(v)) return 'Delayed';
    return 'Not Started';
};

const normalize = (val) => {
    if (!val) return '';
    return val.toString().toLowerCase().replace(/\s+/g, ' ').trim();
};

const findCol = (row, keys) => {
    if (!row) return -1;
    return row.findIndex(cell => {
        const n = normalize(cell);
        return keys.some(k => n.includes(k));
    });
};


const getDashboard = async (req, res) => {
    try {
        const totalLocations   = await Location.count({ where: { is_active: true } });
        const totalSupervisors = await User.count({ where: { role: 'Supervisor', is_active: true } });
        const totalWorkers     = await User.count({ where: { role: 'Worker', is_active: true } });
        const totalActivities  = await LocationActivity.count();
        const completed        = await LocationActivity.count({ where: { status: 'Completed' } });
        const inProgress       = await LocationActivity.count({ where: { status: 'In Progress' } });
        const notStarted       = await LocationActivity.count({ where: { status: 'Not Started' } });
        const delayed          = await LocationActivity.count({ where: { status: 'Delayed' } });

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
                    include: [
                        {
                            model:      Location,
                            as:         'location',
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
                    total_locations:   totalLocations,
                    total_supervisors: totalSupervisors,
                    total_workers:     totalWorkers,
                    total_activities:  totalActivities,
                    completed,
                    in_progress:       inProgress,
                    not_started:       notStarted,
                    delayed
                },
                recent_updates: recentUpdates
            }
        });

    } catch (error) {
        console.error('getDashboard error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select an Excel file'
            });
        }

        const filePath = req.file.path;  //multer stores excel file physically 
        const fileName = req.file.originalname;

        const upload = await ExcelUpload.create({
            uploaded_by: req.user.id,
            file_name:   fileName,
            file_path:   filePath,
            status:      'Processing'
        });

        const workbook = XLSX.readFile(filePath);  //reads excel from
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];

        // convert excel to javascript data 
        const allRows  = XLSX.utils.sheet_to_json(sheet, { //convert sheet to array
            header: 1,                                  //returns 2D array instead of obj
            defval: null,                               //empty cell become null
            raw:    false
        });

        console.log('Total rows:', allRows.length);

        if (allRows.length < 5) {
            await upload.update({ status: 'Failed' });
            return res.status(400).json({
                success: false,
                message: 'Excel file too short'
            });
        }

        const fixedHeaderRow = allRows[1]; // Row 2 - allRows is 2d array
        const activityRow    = allRows[2]; // Row 3
        const subHeaderRow   = allRows[3]; // Row 4
        const dataRows       = allRows.slice(4); // Row 5+

        // CORRIDOR NAME - Row 3 Col 0 se lo
        // "Bhubaneshwar to Puri Road -
        //  Uttra Crossing to Malatipatapur"
        let corridorName = null;
        if (activityRow[0]) {
            corridorName = activityRow[0].toString().trim();
            console.log('Corridor Name:', corridorName);
        }

        // Fixed Column Map
        const colMap = {
            sno:          findCol(fixedHeaderRow, ['s.no', 's no', 'sno', 'sr.no', 'serial']),
            locationName: findCol(fixedHeaderRow, ['name of the location', 'name of location', 'name of locations', 'location name', 'location']),
            locationType: findCol(fixedHeaderRow, ['types of location', 'type of location', 'type of the location']),
            phase:        findCol(fixedHeaderRow, ['phase']),
            supervisor:   findCol(fixedHeaderRow, ['site incharge', 'siteincharge', 'supervisor', 'incharge']),
            vendor:       findCol(fixedHeaderRow, ['vendor', 'vender']),
            roads:        findCol(fixedHeaderRow, ['number of roads', 'no of roads', 'roads']),
            lanes:        findCol(fixedHeaderRow, ['number of lanes', 'no of lanes', 'lanes']),
            solution:     findCol(fixedHeaderRow, ['proposed solution', 'proposed sol', 'solution'])
        };

        console.log('Column Map:', colMap);

        // Activity Detection
        const notActivityWords = [
            'current status', 'status', 'remarks', 'remark',
            'start date', 'end date', 'start', 'end', 'date',
            'current status status(completed, wip,site issue)',
            'activity', 'bhubaneshwar', 'puri', 'road'
        ];

        const isNotActivity = (val) => {
            if (!val) return true;
            const n = normalize(val);
            return notActivityWords.some(w => n.includes(w));
        };

        const activityColumns = [];
        let order = 1;

        for (let c = 9; c < activityRow.length; c++) {
            const cellVal = activityRow[c];
            if (!cellVal) continue;

            const cellStr = cellVal.toString().trim();
            if (isNotActivity(cellStr)) continue;

            let startCol   = -1;
            let endCol     = -1;
            let statusCol  = -1;
            let remarksCol = -1;

            for (let s = c; s < Math.min(c + 6, subHeaderRow.length); s++) {
                const subVal = normalize(subHeaderRow[s]);
                if (subVal.includes('start') && startCol === -1) startCol = s;
                if (subVal.includes('end')   && endCol   === -1) endCol   = s;
            }

            for (let s = c + 1; s < Math.min(c + 6, activityRow.length); s++) {
                const actVal = normalize(activityRow[s]);
                if ((actVal.includes('current status') || actVal.includes('status')) && statusCol  === -1) statusCol  = s;
                if (actVal.includes('remark') && remarksCol === -1) remarksCol = s;
            }

            if (startCol   === -1) startCol   = c;
            if (endCol     === -1) endCol     = c + 1;
            if (statusCol  === -1) statusCol  = c + 2;
            if (remarksCol === -1) remarksCol = c + 3;

            activityColumns.push({
                name: cellStr,
                startCol,
                endCol,
                statusCol,
                remarksCol,
                order
            });

            console.log(` Activity: "${cellStr}" | start:${startCol} end:${endCol} status:${statusCol} remarks:${remarksCol}`);
            order++;
        }

        console.log('Total activities:', activityColumns.length);

        if (activityColumns.length === 0) {
            await upload.update({ status: 'Failed' });
            return res.status(400).json({
                success: false,
                message: 'No activities found'
            });
        }

        // Save activities
        const activityIds = {};
        for (const act of activityColumns) {
            const [subActivity] = await SubActivity.findOrCreate({
                where:    { activity_name: act.name },
                defaults: { is_active: true}
                // defaults: { display_order: act.order }
            });
            activityIds[act.name] = subActivity.id;
        }

        // Process Data Rows
        let processedRows = 0;
        let failedRows    = 0;
        const errors      = [];

        // CORRIDOR NAME TRACKING
        // Excel me multiple corridors ho sakti hain
        // Jab bhi Col 0 me text aaye aur Col 1 empty ho
        // Toh naya corridor start hua
        let currentCorridor = corridorName;

        for (let i = 0; i < dataRows.length; i++) {
            const row         = dataRows[i];
            const excelRowNum = i + 5;

            if (!row) continue;

            // Check karo kya yeh naya corridor hai
            // Col 0 me text hai aur Col 1 empty hai
            if (row[0] && !row[1]) {
                const possibleCorridor = row[0].toString().trim();
                if (possibleCorridor.length > 5) {
                    currentCorridor = possibleCorridor;
                    console.log(`📍 New Corridor: ${currentCorridor}`);
                    continue;
                }
            }

            const rawName = row[colMap.locationName];
            if (!rawName) continue;

            const locationName = rawName.toString().trim();
            if (locationName.length < 2) continue;

            const lowerName = locationName.toLowerCase();
            if (
                lowerName.includes('name of') ||
                lowerName.includes('s.no') ||
                lowerName.includes('location name') ||
                lowerName === 'location' ||
                lowerName === 'name'
            ) continue;

            try {
                // Serial Number
                let serialNumber = processedRows + 1;
                if (colMap.sno !== -1 && row[colMap.sno] !== null) {
                    const parsed = parseInt(row[colMap.sno]);
                    if (!isNaN(parsed) && parsed > 0) serialNumber = parsed;
                }

                // Phase
                let phaseId = null;
                if (colMap.phase !== -1 && row[colMap.phase]) {
                    const phaseName = row[colMap.phase].toString().trim();
                    if (phaseName) {
                        const [phase] = await Phase.findOrCreate({
                            where:    { phase_name: phaseName },
                            defaults: {}
                        });
                        phaseId = phase.id;
                    }
                }

                // Vendor
                let vendorId = null;
                if (colMap.vendor !== -1 && row[colMap.vendor]) {
                const vendorName = row[colMap.vendor].toString().trim();
                if (vendorName) {
                const [vendor] = await Vendor.findOrCreate({
                    where:    { vendor_name: vendorName },
                    defaults: {}
                });
                vendorId = vendor.id;
                }
                }

                // Supervisor
                let supervisorId = null;
                if (colMap.supervisor !== -1 && row[colMap.supervisor]) {
                const supName = row[colMap.supervisor].toString().trim();
                if (supName && supName.length > 1) {
                // Pehle dhundho
                let supervisor = await User.findOne({
            where: { full_name: supName, role: 'Supervisor' }
                });

                // Agar nahi mila toh auto create karo
                if (!supervisor) {
            try {
                const bcryptLib = require('bcryptjs');
                // Phone number generate karo (unique)
                const autoPhone = '90' + Date.now().toString().slice(-8);
                const autoPass  = await bcryptLib.hash('password123', 10);

                supervisor = await User.create({
                    full_name:     supName,
                    phone:         autoPhone,
                    password_hash: autoPass,
                    role:          'Supervisor',
                    is_active:     true,
                    created_by:    req.user.id
                });

                console.log(`  👷 Auto-created Supervisor: ${supName} (Phone: ${autoPhone})`);
            } catch (supErr) {
                // Agar same name se pehle ban chuka hai par case different hai
                supervisor = await User.findOne({
                    where: {
                        role: 'Supervisor',
                        full_name: { [Op.iLike]: supName }
                    }
                });
                if (!supervisor) {
                    console.log(`  ⚠️ Could not create supervisor: ${supName} - ${supErr.message}`);
                }
            }
                }

                if (supervisor) supervisorId = supervisor.id;
                }
                }


                // Location Type
                let locationType = null;
                if (colMap.locationType !== -1 && row[colMap.locationType]) {
                    locationType = row[colMap.locationType].toString().trim();
                }

                // Solution
                let solution = null;
                if (colMap.solution !== -1 && row[colMap.solution]) {
                    solution = row[colMap.solution].toString().trim();
                }

                // Lanes
                let lanes = 0;
                if (colMap.lanes !== -1 && row[colMap.lanes]) {
                    const val = parseInt(row[colMap.lanes]);
                    if (!isNaN(val)) lanes = val;
                }

                // Roads
                let roads = 0;
                if (colMap.roads !== -1 && row[colMap.roads]) {
                    const val = parseInt(row[colMap.roads]);
                    if (!isNaN(val)) roads = val;
                }

                // create location 
                // save corridor name also
     
                const location = await Location.create({
                    upload_id:         upload.id,
                    serial_number:     serialNumber,
                    location_name:     locationName,
                    location_type:     locationType,
                    proposed_solution: solution,
                    no_of_lanes:       lanes,
                    no_of_roads:       roads,
                    phase_id:          phaseId,
                    vendor_id:         vendorId,
                    supervisor_id:     supervisorId,
                    corridor_name:     currentCorridor, // ← SAVE CORRIDOR
                    overall_status:    'Not Started',
                    overall_progress:  0,
                    is_active:         true
                });

                // Activities create karo
                for (const act of activityColumns) {
                    const startDate = parseExcelDate(row[act.startCol]);
                    const endDate   = parseExcelDate(row[act.endCol]);
                    const status    = mapStatus(row[act.statusCol]);
                    const remarks   = row[act.remarksCol]
                                      ? row[act.remarksCol].toString().trim()
                                      : null;

                    await LocationActivity.create({
                        location_id:        location.id,
                        activity_id:        activityIds[act.name],
                        planned_start_date: startDate,
                        planned_end_date:   endDate,
                        status:             status,
                        progress_pct:       0,
                        remarks:            remarks
                    });
                }

                processedRows++;
                console.log(` Row ${excelRowNum}: [${currentCorridor}] → ${locationName}`);

            } catch (rowErr) {
                failedRows++;
                errors.push({
                    row:   excelRowNum,
                    data:  locationName,
                    error: rowErr.message
                });
                console.log(` Row ${excelRowNum}: ${locationName} → ${rowErr.message}`);
            }
        }

        const finalStatus =
            failedRows === 0    ? 'Completed' :
            processedRows === 0 ? 'Failed'    : 'Partial';

        await upload.update({
            status:         finalStatus,
            total_rows:     processedRows + failedRows,
            processed_rows: processedRows,
            failed_rows:    failedRows,
            error_log:      errors,
            processed_at:   new Date()
        });

        await createNotification(
            req.user.id, req.user.id,
            'Excel Uploaded',
            'Excel Upload Completed',
            `${fileName}: ${processedRows} saved, ${failedRows} failed`,
            upload.id, 'excel_upload'
        );

        return res.status(200).json({
            success:          true,
            message:          'Excel uploaded successfully',
            upload_id:        upload.id,
            corridor_name:    currentCorridor,
            processed_rows:   processedRows,
            failed_rows:      failedRows,
            activities_found: activityColumns.map(a => a.name),
            errors:           errors.slice(0, 20)
        });

    } catch (error) {
        console.error('uploadExcel error:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload failed',
            error:   error.message
        });
    }
};


const getUploadHistory = async (req, res) => {
    try {
        const uploads = await ExcelUpload.findAll({
            order:   [['uploaded_at', 'DESC']],
            include: [{
                model:      User,
                as:         'uploader',
                attributes: ['full_name', 'phone']
            }]
        });
        return res.status(200).json({ success: true, data: uploads });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};





const viewUploadData = async (req, res) => {
    try {

        const uploadId = req.params.id;
        if(!uploadId || isNaN(parseInt(uploadId))){
            return res.status(400).json({
                success: false,
                message: 'Invalid upload ID'
            })
        }

        const upload = await ExcelUpload.findByPk(req.params.id, {
            include: [{ model: User, as: 'uploader', attributes: ['full_name'] }]
        });

        if (!upload) {
            return res.status(404).json({ success: false, message: 'Upload not found' });
        }

        const activities = await SubActivity.findAll({
            where: { is_active: true },
            order: [['id', 'ASC']],
            attributes: ['id', 'activity_name']
        });

        const where = {
            upload_id: uploadId,
            is_active: true
        };

        const locations = await Location.findAll({
        where,
        order: [['serial_number', 'ASC']],
        include: [
            { model: Phase, as: 'phase', attributes: ['phase_name'], required: false },
            { model: Vendor, as: 'vendor', attributes: ['vendor_name'], 
                required: false
             },
            { model: User, as: 'supervisor', attributes: ['id', 'full_name', 'phone'], 
                required: false
             },
            {
            model: LocationActivity,
            as: 'activities',
            attributes: ['id', 'status', 'progress_pct', 'planned_start_date', 'planned_end_date', 'remarks'],
            required: false,
            include: [
                {
                    model: SubActivity,
                    as: 'activity',
                    attributes: ['activity_name'],
                    required: false
                }
            ]
            }
            ]
        });

        return res.status(200).json({
            success:    true,
            upload: {
                id: upload.id,
                file_name: upload.file_name,
                uploaded_at: upload.uploaded_at || upload.created_at,
                total_rows: upload.total_rows,
                processed_rows: upload.processed_rows,
                failed_rows: upload.failed_rows,
                status: upload.status,
                uploaded_by: upload.uploader?.full_name
            },
            activities,
            locations
        });
    } catch (error) {
        console.error('viewUploadData ERROR:', error.message);
        console.error('STACK', error.stack);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        const where = {};
        if (role) where.role = role;
        if (search) {
            where[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { phone:     { [Op.iLike]: `%${search}%` } }
            ];
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password_hash'] },

            include: [
                {
                    model: User,
                    as: 'my_supervisor',
                    attributes: ['id', 'full_name']
                }
            ],

            order:       [['id', 'DESC']]
        });

        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const createUser = async (req, res) => {
    try {
        //  Password NAHI liya body se
        const { full_name, phone, email, role, employee_id } = req.body;

        //  Validation - Password NAHI hai list mein
        if (!full_name || !phone || !role) {
            return res.status(400).json({
                success: false,
                message: 'full_name, phone, role are required'
                //  Password nahi maanga
            });
        }

        //  Role check - Sirf Supervisor ya Worker
        // if (!['Supervisor', 'Worker'].includes(role)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Role must be Supervisor or Worker'
        //     });
        // }

        if (!role || !role.trim()){
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            })
        }

        if (role === 'Admin'){
            return res.status(403).json({
                success: false,
                message: 'Cannot create Admin from this panel'
            })
        }

        //  Phone already exist check
        const existing = await User.findOne({
            where: { phone: phone.trim() }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Phone already registered'
            });
        }

        //  Email check (agar diya hai toh)
        if (email) {
            const emailExists = await User.findOne({
                where: { email: email.trim() }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        //  Invite Token Generate karo
        // crypto = Node.js built-in library
        // 32 random bytes = 64 character hex string
        const invite_token = crypto.randomBytes(32).toString('hex');

        // Token 24 ghante mein expire hoga
        const invite_token_expiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        //  User create karo - PASSWORD NULL
        const user = await User.create({
            full_name:           full_name.trim(),
            phone:               phone.trim(),
            email:               email         || null,
            password_hash:       null,          //  No Password
            role,
            employee_id:         employee_id   || null,
            created_by:          req.user.id,
            invite_token,                        //  Token save
            invite_token_expiry,                 //  Expiry save
            is_password_set:     false,          //  Password abhi set nahi
            is_active:           false           //  Active tab hoga jab password set ho
        });

        //  Email bhejo - Sirf agar email diya gaya ho
        if (email) {
            try {
                await sendInviteEmail(
                    email,
                    full_name.trim(),
                    invite_token,
                    role
                );
            } catch (emailErr) {
                // Email fail hone pe bhi user ban jayega
                // Admin manually link share kar sakta hai
                console.error('Email send failed:', emailErr.message);
            }
        }

        //  Frontend ko invite link bhi bhejo
        // Taaki admin manually bhi share kar sake
        const inviteLink =
            `${process.env.FRONTEND_URL}/set-password?token=${invite_token}`;

        return res.status(201).json({
            success: true,
            message: email
                ? `${role} created! Invite email sent to ${email}`
                : `${role} created! Share this link manually`,
            invite_link: inviteLink, //  Admin ko link dikhao
            user: {
                id:        user.id,
                full_name: user.full_name,
                phone:     user.phone,
                email:     user.email,
                role:      user.role,
                is_active: user.is_active  // false dikhega
            }
        });

    } catch (error) {
        console.error('[createUser] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const sendInviteEmail = async (email, name, token, role) => {
    const link =
        `${process.env.FRONTEND_URL}/set-password?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from:    process.env.EMAIL_USER,
        to:      email,
        subject: `Field Tracker - Set Your Password`,
        html: `
          <div style="font-family:Arial;max-width:500px;
                      margin:auto;padding:30px;
                      border:1px solid #ddd;border-radius:8px;">
            <h2 style="color:#2563EB;">Field Tracking App</h2>
            <p>Hello <strong>${name}</strong>!</p>
            <p>You have been added as 
               <strong>${role}</strong>.<br/>
               Click below to set your password:
            </p>
            <a href="${link}"
               style="display:inline-block;
                      background:#2563EB;color:white;
                      padding:12px 30px;border-radius:6px;
                      text-decoration:none;margin:16px 0;">
              Set My Password
            </a>
            <p style="color:#e53e3e;">
              This link expires in <strong>24 hours</strong>.
            </p>
          </div>
        `
    });
};


const updateUser = async (req, res) => {
    try {
        // ── Step 1: Find user 
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // ── Step 2: Get fields from request body ──────────────
        const { full_name, phone, email, employee_id, role } = req.body;

        console.log('[updateUser] Request body:', req.body);
        console.log('[updateUser] Current user role:', user.role);
        console.log('[updateUser] New role requested:', role);

        // ── Step 3: Protect Admin role ────────────────────────
        if (user.role === 'Admin' && role && role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin role cannot be changed'
            });
        }

        // ── Step 4: Prevent assigning Admin role 
        if (role === 'Admin' && user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot assign Admin role from this panel'
            });
        }

        // ── Step 5: Handle role change side effects ───────────
        const roleIsChanging = role && role !== user.role;

        if (roleIsChanging) {
            console.log(`[updateUser] Role changing: ${user.role} → ${role}`);

            // Supervisor → Worker
            // Must unassign all their workers + locations
            if (user.role === 'Supervisor' && role === 'Worker') {
                await User.update(
                    { supervisor_id: null },
                    { where: { supervisor_id: user.id } }
                );

                await Location.update(
                    { supervisor_id: null, supervisor_assigned_at: null },
                    { where: { supervisor_id: user.id } }
                );

                console.log(`[updateUser] Cleared supervisor assignments for user ${user.id}`);
            }

            // Worker → Supervisor
            // Must clear their own supervisor_id
            if (user.role === 'Worker' && role === 'Supervisor') {
                console.log(`[updateUser] Worker becoming Supervisor, clearing supervisor_id`);
            }
        }

        // ── Step 6: Build update object ───────────────────────
        // ✅ No spread, no external variables — all inline and safe
        const updateData = {};

        updateData.full_name = full_name !== undefined
            ? full_name
            : user.full_name;

        updateData.phone = phone !== undefined
            ? phone
            : user.phone;

        updateData.email = email !== undefined
            ? email
            : user.email;

        updateData.employee_id = employee_id !== undefined
            ? employee_id
            : user.employee_id;

        updateData.role = role !== undefined
            ? role
            : user.role;

        // Clear supervisor_id if becoming Supervisor
        if (roleIsChanging && role === 'Supervisor') {
            updateData.supervisor_id = null;
        }

        console.log('[updateUser] Final updateData:', updateData);

        // ── Step 7: Save to database ──────────────────────────
        await user.update(updateData);

        // ── Step 8: Re-fetch with associations ────────────────
        const updatedUser = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                {
                    model:      User,
                    as:         'my_supervisor',
                    attributes: ['id', 'full_name']
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: roleIsChanging
                ? `User updated! Role changed to ${role}`
                : 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('[updateUser] Error:', error.message);
        console.error('[updateUser] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.update({ is_active: !user.is_active });
        return res.status(200).json({
            success:   true,
            message:   `User ${user.is_active ? 'activated' : 'deactivated'}`,
            is_active: user.is_active
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        //  If supervisor → unassign from all locations first
        if (user.role === 'Supervisor') {
            await Location.update(
                { supervisor_id: null, supervisor_assigned_at: null },
                { where: { supervisor_id: id } }
            );
        }

        //  If worker → unassign from all activities first
        if (user.role === 'Worker') {
            await LocationActivity.update(
                { worker_id: null },
                { where: { worker_id: id } }
            );
        }

        //  Now delete the user
        await user.destroy();

        return res.status(200).json({
            success: true,
            message: `${user.full_name} deleted successfully`
        });

    } catch (error) {
        console.error('[deleteUser] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getLocations = async (req, res) => {
    try {
        const { search } = req.query;

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit || 10));
        const offset = (page - 1) * limit;

        const where = { is_active: true};
        if (search) where.location_name = {[Op.iLike]: `%${search}%`};

        const {count, rows} = await Location.findAndCountAll({
            where, 
            limit, 
            offset,
            order: [['serial_number', 'ASC']],
            distinct: true,
            include: [
                {model: Phase, as: 'phase', attributes: ['phase_name'], required: false},
                { model: Vendor, as: 'vendor', attributes: ['vendor_name'], required: false},
                {model: User, as: 'supervisor', attributes: ['id', 'full_name', 'phone'], required: false},
                { model: LocationActivity, as: 'activities', attributes: ['id', 'status', 'progress_pct'], required: false},
            ]
        });

        const totalPages = Math.ceil(count / limit);

        // const where = { is_active: true };
        // if (search) where.location_name = { [Op.iLike]: `%${search}%` };

        // const locations = await Location.findAll({
        //     where,
        //     order:   [['serial_number', 'ASC']],
        //     include: [
        //         { model: Phase,  as: 'phase',      attributes: ['phase_name'], required: false },
        //         { model: Vendor, as: 'vendor',     attributes: ['vendor_name'], required: false },
        //         { model: User,   as: 'supervisor', attributes: ['id', 'full_name', 'phone'], required: false },
        //         { model: LocationActivity, as: 'activities', attributes: ['id', 'status', 'progress_pct'], required: false }
        //     ]
        // });

        return res.status(200).json({
            success: true,
            data:    rows,
            pagination: {
                total: count, 
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        });

    } catch (error) {
        console.error('[getLocations] Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getLocationDetail = async (req, res) => {
    try {
        const location = await Location.findByPk(req.params.id, {
            include: [
                { model: Phase,  as: 'phase',      attributes: ['phase_name'] },
                { model: Vendor, as: 'vendor',     attributes: ['vendor_name'] },
                { model: User,   as: 'supervisor', attributes: ['id', 'full_name'] },
                {
                    model:   LocationActivity,
                    as:      'activities',
                    include: [
                        { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                        { model: User,        as: 'worker',   attributes: ['id', 'full_name'] }
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


const assignSupervisor = async (req, res) => {
    try {
        const { supervisor_id } = req.body;
        if (!supervisor_id) {
            return res.status(400).json({ success: false, message: 'supervisor_id required' });
        }

        const supervisor = await User.findOne({
            where: { id: supervisor_id, role: 'Supervisor', is_active: true }
        });
        if (!supervisor) return res.status(404).json({ success: false, message: 'Supervisor not found' });

        const location = await Location.findByPk(req.params.id);
        if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

        await location.update({
            supervisor_id,
            supervisor_assigned_at: new Date()
        });

        await createNotification(
            supervisor_id, req.user.id,
            'Supervisor Assigned',
            'New Location Assigned',
            `You have been assigned to: ${location.location_name}`,
            location.id, 'location'
        );

        return res.status(200).json({ success: true, message: `Supervisor assigned successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getActivities = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(100, parseInt(req.query.limit) || 10);
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || '';

        // filter 
        if(req.user.role === 'Admin'){
        const where = {};
        if (search) {
            where.activity_name = { [Op.iLike]: `%${search}%` };
        }

        const { count, rows } = await SubActivity.findAndCountAll({
            where,
            order:    [['id', 'ASC']],
            limit,
            offset,
            distinct: true,
        });

        

        return res.status(200).json({
            success: true,
            data:    rows,
            pagination: {
                total:       count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                hasNextPage: page < Math.ceil(count / limit),
                hasPrevPage: page > 1,
            }
        });
    }

    const where = {};
    const locationWhere = {
        is_active: true
    }

    if (req.user.role === 'Supervisor') {
            locationWhere.supervisor_id = req.user.id;
    }

    if(req.user.role === 'Worker'){
        where.worker_id = req.user.id;
    }


    if(search){
        where[Op.or] = [
            { '$location.location_name$': { [Op.iLike]: `%${search}%` }},
            { '$activity.activity_name$': { [Op.iLike]: `%${search}%` }},

        ]
    }

    const { count, rows } = await LocationActivity.findAndCountAll({
            where,
            limit,
            offset,
            order:    [['id', 'DESC']],
            distinct: true,
            include: [
                {
                    model:      Location,
                    as:         'location',
                    attributes: ['id', 'location_name', 'corridor_name'],
                    where:      locationWhere,  // only active locations
                    required:   true,           // INNER JOIN — inactive location ki activities exclude
                },
                {
                    model:      SubActivity,
                    as:         'activity',
                    attributes: ['activity_name'],
                    required:   false
                },
                {
                    model:      User,
                    as:         'worker',
                    attributes: ['id', 'full_name'],
                    required:   false
                }
            ]
        });

    return res.status(200).json({
            success: true,
            data:    rows,
            pagination: {
                total:       count,
                page,
                limit,
                totalPages:  Math.ceil(count / limit),
                hasNextPage: page < Math.ceil(count / limit),
                hasPrevPage: page > 1,
            }
        });

    } catch (error) {
        console.error('[getActivities] Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const createActivity = async (req, res) => {
    try {
        const { activity_name,
            planned_start_date,
            planned_end_date
         } = req.body;

        if (!activity_name) {
            return res.status(400).json({
                success: false,
                message: 'activity_name required'
            });
        }

        //  Activity create karo
        const activity = await SubActivity.create({
            activity_name: activity_name.trim(),
            is_active:     true
        });

        //  Saari existing locations fetch karo
        const allLocations = await Location.findAll({
            where: { is_active: true }
        });

        //  Har location mein ye activity add karo
        if (allLocations.length > 0) {
            const locationActivities = allLocations.map(loc => ({
                location_id:  loc.id,
                activity_id:  activity.id,
                status:       'Not Started',
                progress_pct: 0,
                remarks:      null,
                planned_start_date: planned_start_date || null,
                planned_end_date: planned_end_date || null,
            }));

            await LocationActivity.bulkCreate(locationActivities, {
                ignoreDuplicates: true //  Already exist kare toh skip karo
            });

            console.log(` Activity "${activity_name}" linked to ${allLocations.length} locations`);
        }

        return res.status(201).json({
            success:            true,
            message:            `Activity created and linked to ${allLocations.length} locations!`,
            activity,
            locations_linked:   allLocations.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const updateActivity = async (req, res) => {
    try {
        const activity = await SubActivity.findByPk(req.params.id);
        if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

        await activity.update(req.body);
        return res.status(200).json({ success: true, message: 'Activity updated', activity });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const deleteActivity = async (req, res) => {
    try {
        const deleted = await SubActivity.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ success: false, message: 'Activity not found' });
        return res.status(200).json({ success: true, message: 'Activity deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getReports = async (req, res) => {
    try {
        const { phase_id, vendor_id, supervisor_id, status } = req.query;

        const locationWhere = { is_active: true };
        if (phase_id)      locationWhere.phase_id      = phase_id;
        if (vendor_id)     locationWhere.vendor_id     = vendor_id;
        if (supervisor_id) locationWhere.supervisor_id = supervisor_id;

        const activityWhere = {};
        if (status) activityWhere.status = status;

        const locations = await Location.findAll({
            where:   locationWhere,
            order:   [['serial_number', 'ASC']],
            include: [
                { model: Phase,  as: 'phase',      attributes: ['phase_name'] },
                { model: Vendor, as: 'vendor',     attributes: ['vendor_name'] },
                { model: User,   as: 'supervisor', attributes: ['full_name'] },
                {
                    model:    LocationActivity,
                    as:       'activities',
                    where:    Object.keys(activityWhere).length > 0 ? activityWhere : undefined,
                    required: false,
                    include:  [
                        { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                        { model: User,        as: 'worker',   attributes: ['full_name'] }
                    ]
                }
            ]
        });

        return res.status(200).json({ success: true, data: locations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const exportReports = async (req, res) => {
    try {
        const locations = await Location.findAll({
            where:   { is_active: true },
            include: [
                { model: Phase,  as: 'phase',      attributes: ['phase_name'] },
                { model: Vendor, as: 'vendor',     attributes: ['vendor_name'] },
                { model: User,   as: 'supervisor', attributes: ['full_name'] },
                {
                    model:    LocationActivity,
                    as:       'activities',
                    required: false,
                    include:  [
                        { model: SubActivity, as: 'activity', attributes: ['activity_name'] },
                        { model: User,        as: 'worker',   attributes: ['full_name'] }
                    ]
                }
            ]
        });

        const reportData = [];
        locations.forEach(loc => {
            loc.activities.forEach(act => {
                reportData.push({
                    'S.No':          loc.serial_number,
                    'Location':      loc.location_name,
                    'Type':          loc.location_type,
                    'Phase':         loc.phase        ? loc.phase.phase_name     : '',
                    'Vendor':        loc.vendor       ? loc.vendor.vendor_name   : '',
                    'Supervisor':    loc.supervisor   ? loc.supervisor.full_name : '',
                    'Activity':      act.activity     ? act.activity.activity_name : '',
                    'Worker':        act.worker       ? act.worker.full_name     : '',
                    'Planned Start': act.planned_start_date,
                    'Planned End':   act.planned_end_date,
                    'Status':        act.status,
                    'Progress %':    act.progress_pct,
                    'Remarks':       act.remarks
                });
            });
        });

        const wb       = XLSX.utils.book_new();
        const ws       = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const fileName = `report_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../uploads', fileName);
        XLSX.writeFile(wb, filePath);

        res.download(filePath, 'Report.xlsx', () => {
            try { fs.unlinkSync(filePath); } catch (e) {}
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getEvidence = async (req, res) => {
    try {
        const { location_id, photo_type } = req.query;
        const where = { photos: { [Op.ne]: null } };
        if (photo_type) where.photo_type = photo_type;

        const evidence = await TaskUpdate.findAll({
            where,
            order:   [['created_at', 'DESC']],
            include: [
                { model: User, as: 'updater', attributes: ['full_name'] },
                {
                    model:   LocationActivity,
                    as:      'location_activity',
                    include: [
                        {
                            model:      Location,
                            as:         'location',
                            attributes: ['location_name'],
                            where:      location_id ? { id: location_id } : undefined
                        },
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


const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { to_user_id: req.user.id } }
        );
        return res.status(200).json({ success: true, message: 'All marked as read' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// HELPER FUNCTION 
// Upload excel ke end me ya assignSupervisor ke end me
// Location ka overall progress auto update karo

const updateLocationProgress = async (locationId) => {
    try {
        const acts = await LocationActivity.findAll({
            where: { location_id: locationId }
        });

        const total = acts.length;
        if (total === 0) return;

        const completed = acts.filter(a => a.status === 'Completed').length;
        const inProgress = acts.filter(a => a.status === 'In Progress').length;
        const pct = Math.round((completed / total) * 100);

        let status = 'Not Started';
        if (completed === total) status = 'Completed';
        else if (inProgress > 0 || completed > 0) status = 'In Progress';

        await Location.update(
            { overall_progress: pct, overall_status: status },
            { where: { id: locationId } }
        );
    } catch (e) {
        console.error('Progress update error:', e.message);
    }
};


const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await user.update({ password_hash });

        return res.status(200).json({
            success: true,
            message: `Password reset for ${user.full_name}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const createLocation = async (req, res) => {
    try {

        //  STEP 1 — Destructure ALL fields from req.body
        const {
            location_name,
            corridor_name,
            location_type,
            serial_number,
            proposed_solution,
            no_of_lanes,
            no_of_roads,
            phase_id,          //  NEW
            vendor_id,         //  NEW
            supervisor_id,     //  NEW
            phase_name,        //  NEW — optional, if admin types name
            vendor_name        //  NEW — optional, if admin types name
        } = req.body;

        //  STEP 2 — Validation
        if (!location_name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'location_name is required.'
            });
        }

        //  STEP 3 — Duplicate check
        const duplicate = await Location.findOne({
            where: {
                location_name: location_name.trim(),
                is_active:     true
            }
        });
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Location "${location_name.trim()}" already exists.`
            });
        }

        //  STEP 4 — Resolve Phase
        // phase_id aaya → directly use karo
        // phase_name aaya → findOrCreate karo
        // kuch nahi aaya → null
        let resolvedPhaseId = phase_id || null;
        if (!resolvedPhaseId && phase_name?.trim()) {
            const [phase] = await Phase.findOrCreate({
                where:    { phase_name: phase_name.trim() },
                defaults: {}
            });
            resolvedPhaseId = phase.id;
        }

        //  STEP 5 — Resolve Vendor
        let resolvedVendorId = vendor_id || null;
        if (!resolvedVendorId && vendor_name?.trim()) {
            const [vendor] = await Vendor.findOrCreate({
                where:    { vendor_name: vendor_name.trim() },
                defaults: {}
            });
            resolvedVendorId = vendor.id;
        }
        //  STEP 6 — Resolve Supervisor
        let resolvedSupervisorId = supervisor_id || null;
        if (resolvedSupervisorId) {
            const supervisor = await User.findOne({
                where: {
                    id:        resolvedSupervisorId,
                    role:      'Supervisor',
                    is_active: true
                }
            });
            if (!supervisor) {
                return res.status(404).json({
                    success: false,
                    message: 'Supervisor not found or inactive.'
                });
            }
        }

        //  STEP 7 — Create Location with ALL fields
        const location = await Location.create({
            location_name:          location_name.trim(),
            corridor_name:          corridor_name?.trim()     || null,
            location_type:          location_type             || null,
            serial_number:          serial_number             || null,
            proposed_solution:      proposed_solution?.trim() || null,
            no_of_lanes:            parseInt(no_of_lanes)     || 0,
            no_of_roads:            parseInt(no_of_roads)     || 0,
            phase_id:               resolvedPhaseId,           // 
            vendor_id:              resolvedVendorId,          // 
            supervisor_id:          resolvedSupervisorId,      // 
            supervisor_assigned_at: resolvedSupervisorId
                                        ? new Date()
                                        : null,
            upload_id:              null,
            overall_status:         'Not Started',
            overall_progress:       0,
            is_active:              true
        });

        //  STEP 8 — Link all existing Activities to this location
        const allActivities = await SubActivity.findAll({
            where: { is_active: true },
            order: [['id', 'ASC']]
        });

        if (allActivities.length > 0) {
            const locationActivities = allActivities.map(act => ({
                location_id:  location.id,
                activity_id:  act.id,
                status:       'Not Started',
                progress_pct: 0,
                remarks:      null
            }));
            await LocationActivity.bulkCreate(locationActivities, {
                ignoreDuplicates: true
            });
        }

        //  STEP 9 — Send notification to Supervisor (if assigned)
        if (resolvedSupervisorId) {
            await createNotification(
                resolvedSupervisorId,
                req.user.id,
                'Supervisor Assigned',
                'New Location Assigned',
                `You have been assigned to: ${location_name.trim()}`,
                location.id,
                'location'
            );
        }

        //  STEP 10 — Re-fetch with all associations
        const created = await Location.findByPk(location.id, {
            include: [
                {
                    model:      Phase,
                    as:         'phase',
                    attributes: ['phase_name'],
                    required:   false
                },
                {
                    model:      Vendor,
                    as:         'vendor',
                    attributes: ['vendor_name'],
                    required:   false
                },
                {
                    model:      User,
                    as:         'supervisor',
                    attributes: ['id', 'full_name', 'phone'],
                    required:   false
                },
                {
                    model:    LocationActivity,
                    as:       'activities',
                    required: false,
                    include:  [{
                        model:      SubActivity,
                        as:         'activity',
                        attributes: ['activity_name'],
                        required:   false
                    }]
                }
            ]
        });

        return res.status(201).json({
            success:           true,
            message:           `Location created with ${allActivities.length} activities linked!`,
            data:              created,
            activities_linked: allActivities.length
        });

    } catch (error) {
        console.error('[createLocation] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const updateLocation = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const {
            location_name,
            corridor_name,
            location_type,
            serial_number,
            proposed_solution,
            no_of_lanes,
            no_of_roads,
            phase_id,
            supervisor_id,
            vendor_id,
            phase_name,
            vendor_name
        } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!location_name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'location_name is required.'
            });
        }

        // ── Existence check ───────────────────────────────────
        const location = await Location.findOne({
            where: { id, is_active: true }
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }

        // ── Duplicate name check (exclude self) ───────────────
        const duplicate = await Location.findOne({
            where: {
                location_name: location_name.trim(),
                is_active:     true,
                id:            { [Op.ne]: id }
            }
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Another location named "${location_name.trim()}" already exists.`
            });
        }

        // ── BUG #2 FIX: Resolve Phase ─────────────────────────
        let resolvedPhaseId = phase_id || null;
        if (!resolvedPhaseId && phase_name?.trim()) {
            const [phase] = await Phase.findOrCreate({
                where:    { phase_name: phase_name.trim() },
                defaults: {}
            });
            resolvedPhaseId = phase.id;
        }

        // ── BUG #2 FIX: Resolve Vendor ────────────────────────
        let resolvedVendorId = vendor_id || null;
        if (!resolvedVendorId && vendor_name?.trim()) {
            const [vendor] = await Vendor.findOrCreate({
                where:    { vendor_name: vendor_name.trim() },
                defaults: {}
            });
            resolvedVendorId = vendor.id;
        }

        // ── BUG #2 FIX: Resolve Supervisor ───────────────────
        let resolvedSupervisorId = supervisor_id || null;
        if (resolvedSupervisorId) {
            const supervisor = await User.findOne({
                where: {
                    id:        resolvedSupervisorId,
                    role:      'Supervisor',
                    is_active: true
                }
            });
            if (!supervisor) {
                return res.status(404).json({
                    success: false,
                    message: 'Supervisor not found or inactive.'
                });
            }
        }

        // ── BUG #2 FIX: supervisorChanged flag ───────────────
        const supervisorChanged =
            String(resolvedSupervisorId) !== String(location.supervisor_id);

        // ── Update Location ───────────────────────────────────
        // BUG #1 FIX: This await is now correctly INSIDE the function
        await location.update({
            location_name:     location_name.trim(),
            corridor_name:     corridor_name?.trim()     || null,
            location_type:     location_type             || null,
            serial_number:     serial_number !== undefined
                                   ? serial_number
                                   : location.serial_number,
            proposed_solution: proposed_solution?.trim() || null,
            no_of_lanes:       no_of_lanes !== undefined
                                   ? parseInt(no_of_lanes)
                                   : location.no_of_lanes,
            no_of_roads:       no_of_roads !== undefined
                                   ? parseInt(no_of_roads)
                                   : location.no_of_roads,
            phase_id:               resolvedPhaseId,
            vendor_id:              resolvedVendorId,
            supervisor_id:          resolvedSupervisorId,
            supervisor_assigned_at: supervisorChanged
                                        ? new Date()
                                        : location.supervisor_assigned_at
        });

        // ── Notify new supervisor (only if changed) ───────────
        // BUG #1 FIX: This await is now correctly INSIDE the function
        if (supervisorChanged && resolvedSupervisorId) {
            await createNotification(
                resolvedSupervisorId,
                req.user.id,
                'Supervisor Assigned',
                'Location Assigned to You',
                `You have been assigned to: ${location_name.trim()}`,
                location.id,
                'location'
            );
        }

        // ── Re-fetch with associations ────────────────────────
        const updated = await Location.findByPk(id, {
            include: [
                {
                    model:      Phase,
                    as:         'phase',
                    attributes: ['phase_name'],
                    required:   false
                },
                {
                    model:      Vendor,
                    as:         'vendor',
                    attributes: ['vendor_name'],
                    required:   false
                },
                {
                    model:      User,
                    as:         'supervisor',
                    attributes: ['id', 'full_name', 'phone'],
                    required:   false
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Location updated successfully.',
            data:    updated
        });

    } catch (error) {
        console.error('[updateLocation] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const deleteLocation = async (req, res) => {
    // Transaction — agar beech me kuch fail ho to sab rollback ho
    const t = await sequelize.transaction();
    try {
        const id = parseInt(req.params.id);

        // Location dhundo 
        const location = await Location.findOne({
            where: { id, is_active: true },
            transaction: t
        });

        if (!location) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }

        const deletedSerial = location.serial_number;

        //Soft Delete 
        await location.update({ is_active: false }, { transaction: t });

        await LocationActivity.destroy({
            where: { location_id: id},
            transaction: t
        });

        //  Serial Renumber 
        // Jis location ka serial 8 tha uske baad wale sab
        // serial_number - 1 ho jayenge (9→8, 10→9, 11→10...)
        if (deletedSerial !== null && deletedSerial !== undefined) {

            const whereToShift = {
                is_active:     true,
                serial_number: { [Op.gt]: deletedSerial }, // sirf neeche wale
            };

            // Upload ke scope me renumber karo 
            // Taaki doosre uploads affect na ho
            if (location.upload_id) {
                whereToShift.upload_id = location.upload_id;
            } else {
                // Manual locations (bina Excel ke add kiye)
                whereToShift.upload_id = null;
            }

            //  Sequelize decrement = serial_number = serial_number - 1
            await Location.decrement(
                { serial_number: 1 },
                { where: whereToShift, transaction: t }
            );
        }

        // Commit 
        await t.commit();

        return res.status(200).json({
            success: true,
            message: `Location "${location.location_name}" deleted and serial numbers updated.`
        });

    } catch (error) {
        await t.rollback(); //  fail hone pe sab undo
        console.error('[deleteLocation] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const assignWorkerToSupervisor = async (req, res) => {
    try {
        const workerId     = parseInt(req.params.id);
        const { supervisor_id } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!supervisor_id) {
            return res.status(400).json({
                success: false,
                message: 'supervisor_id is required'
            });
        }

        // ── Verify Worker exists ──────────────────────────────
        const worker = await User.findOne({
            where: { id: workerId, role: 'Worker' }
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        // ── Verify Supervisor exists and is active ────────────
        const supervisor = await User.findOne({
            where: {
                id:        supervisor_id,
                role:      'Supervisor',
                is_active: true
            }
        });

        if (!supervisor) {
            return res.status(404).json({
                success: false,
                message: 'Supervisor not found or inactive'
            });
        }

        // ── Assign ────────────────────────────────────────────
        await worker.update({ supervisor_id });

        // ── Notify Supervisor ─────────────────────────────────
        await createNotification(
            supervisor_id,
            req.user.id,
            'Worker Assigned',
            'New Worker Assigned to You',
            `${worker.full_name} has been assigned to you`,
            worker.id,
            'User'
        );

        return res.status(200).json({
            success: true,
            message: `${worker.full_name} assigned to ${supervisor.full_name}`,
            data: {
                worker_id:       worker.id,
                worker_name:     worker.full_name,
                supervisor_id:   supervisor.id,
                supervisor_name: supervisor.full_name
            }
        });

    } catch (error) {
        console.error('[assignWorkerToSupervisor] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── REMOVE WORKER FROM SUPERVISOR ────────────────────────────
// DELETE /admin/users/:id/remove-supervisor
// :id = Worker's user ID

const removeWorkerFromSupervisor = async (req, res) => {
    try {
        const workerId = parseInt(req.params.id);

        // ── Verify Worker exists ──────────────────────────────
        const worker = await User.findOne({
            where: { id: workerId, role: 'Worker' }
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        if (!worker.supervisor_id) {
            return res.status(400).json({
                success: false,
                message: 'Worker is not assigned to any supervisor'
            });
        }

        const oldSupervisorId = worker.supervisor_id;

        // ── Remove Assignment 
        await worker.update({ supervisor_id: null });

        return res.status(200).json({
            success: true,
            message: `${worker.full_name} unassigned from supervisor`
        });

    } catch (error) {
        console.error('[removeWorkerFromSupervisor] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//  BULK ASSIGN WORKERS TO SUPERVISOR 
// POST /admin/users/bulk-assign
// Body: { supervisor_id, worker_ids: [1,2,3] }

const bulkAssignWorkers = async (req, res) => {
    try {
        const { supervisor_id, worker_ids } = req.body;

        //  Validation 
        if (!supervisor_id) {
            return res.status(400).json({
                success: false,
                message: 'supervisor_id is required'
            });
        }

        if (!worker_ids || !Array.isArray(worker_ids) || worker_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'worker_ids array is required and cannot be empty'
            });
        }

        //  Verify Supervisor 
        const supervisor = await User.findOne({
            where: {
                id:        supervisor_id,
                role:      'Supervisor',
                is_active: true
            }
        });

        if (!supervisor) {
            return res.status(404).json({
                success: false,
                message: 'Supervisor not found or inactive'
            });
        }

        // Bulk Update 
        const [updatedCount] = await User.update(
            { supervisor_id },
            {
                where: {
                    id:   { [Op.in]: worker_ids },
                    role: 'Worker'
                }
            }
        );

        // Notify Supervisor 
        await createNotification(
            supervisor_id,
            req.user.id,
            'Workers Assigned',
            'Multiple Workers Assigned to You',
            `${updatedCount} worker(s) have been assigned to you`,
            supervisor_id,
            'User'
        );

        return res.status(200).json({
            success:       true,
            message:       `${updatedCount} worker(s) assigned to ${supervisor.full_name}`,
            updated_count: updatedCount
        });

    } catch (error) {
        console.error('[bulkAssignWorkers] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── GET SUPERVISORS WITH THEIR WORKERS 
// GET /admin/supervisors-with-workers

const getSupervisorsWithWorkers = async (req, res) => {
    try {
        const supervisors = await User.findAll({
            where: { role: 'Supervisor' },
            attributes: [
                'id', 'full_name', 'phone',
                'email', 'employee_id',
                'is_active', 'status'
            ],
            include: [
                {
                    model:      User,
                    as:         'my_workers',
                    attributes: [
                        'id', 'full_name', 'phone',
                        'email', 'employee_id',
                        'is_active', 'status'
                    ],
                    required: false // LEFT JOIN — show supervisors with 0 workers too
                }
            ],
            order: [['full_name', 'ASC']]
        });

        // Add worker count to each supervisor
        const result = supervisors.map(sup => ({
            ...sup.toJSON(),
            worker_count: sup.my_workers ? sup.my_workers.length : 0
        }));

        return res.status(200).json({
            success: true,
            data:    result,
            total:   result.length
        });

    } catch (error) {
        console.error('[getSupervisorsWithWorkers] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── GET UNASSIGNED WORKERS 
// GET /admin/unassigned-workers
// Returns workers not assigned to any supervisor

const getUnassignedWorkers = async (req, res) => {
    try {
        const workers = await User.findAll({
            where: {
                role:          'Worker',
                supervisor_id: null   // not assigned to anyone
            },
            attributes: [
                'id', 'full_name', 'phone',
                'email', 'employee_id', 'is_active'
            ],
            order: [['full_name', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data:    workers,
            total:   workers.length
        });

    } catch (error) {
        console.error('[getUnassignedWorkers] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};





module.exports = {
    getDashboard,
    uploadExcel,
    getUploadHistory,
    viewUploadData,
    getUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getLocations,
    getLocationDetail,
    assignSupervisor,
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getReports,
    exportReports,
    getEvidence,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    resetPassword,
    updateLocationProgress,
    createLocation,
    updateLocation,
    deleteLocation,

    assignWorkerToSupervisor,
    removeWorkerFromSupervisor,
    bulkAssignWorkers,
    getSupervisorsWithWorkers,
    getUnassignedWorkers,
    
};

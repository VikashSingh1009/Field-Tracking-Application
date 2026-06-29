// controllers/masterController.js
// ─────────────────────────────────────────────────────────────
// NEW FILE — Master Management CRUD
// Handles all dropdown/master data for the application
// Uses existing MasterLookup model — no new tables needed
// ─────────────────────────────────────────────────────────────
'use strict';

const { Op }          = require('sequelize');
const { MasterLookup, AuditLog, Phase, Vendor  } = require('../models/index');

// ── VALID CATEGORIES ──────────────────────────────────────────
// These are all allowed master types in the system
const VALID_CATEGORIES = [
    'location_type',
    'priority',
    'status',
    'zone',
    'activity_type',
    'vendor_type',
    'phase_type',
    'category'
];


// ── GET ALL MASTERS ───────────────────────────────────────────
// GET /admin/masters
// GET /admin/masters?category=location_type
// GET /admin/masters?category=priority&is_active=true

const getMasters = async (req, res) => {
    try {
        const { category, is_active, search } = req.query;

        const where = {};

        // Filter by category if provided
        if (category) 
        {
            where.category = category.trim().toLowerCase();

        }

        // Filter by active status if provided
        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        // Search by label or value
        if (search) {
            where[Op.or] = [
                { label: { [Op.iLike]: `%${search}%` } },
                { value: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const masters = await MasterLookup.findAll({
            where,
            order: [
                ['category',   'ASC'],
                ['sort_order', 'ASC'],
                ['label',      'ASC']
            ],
            attributes: [
                'id', 'category', 'value', 'label',
                'description', 'sort_order', 'is_active',
                'created_at'
            ]
        });

        // Group by category for easier frontend consumption
        const grouped = {};
        masters.forEach(m => {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(m);
        });

        return res.status(200).json({
            success: true,
            data:    masters,    // flat list
            grouped,             // grouped by category
            total:   masters.length
        });

    } catch (error) {
        console.error('[getMasters] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── GET MASTERS BY CATEGORY ───────────────────────────────────
// GET /admin/masters/:category
// Returns only active masters for a specific category
// Used by dropdowns throughout the app

const getMastersByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const masters = await MasterLookup.findAll({
            where: {
                category: category.trim().toLowerCase(),
                is_active: true    // only active values for dropdowns
            },
            order:      [['sort_order', 'ASC'], ['label', 'ASC']],
            attributes: ['id', 'category', 'value', 'label', 'description']
        });

        return res.status(200).json({
            success:  true,
            category,
            data:     masters,
            total:    masters.length
        });

    } catch (error) {
        console.error('[getMastersByCategory] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── CREATE MASTER ─────────────────────────────────────────────
// POST /admin/masters
// Body: { category, value, label, description, sort_order }

const createMaster = async (req, res) => {
    try {
        const {
            category,
            value,
            label,
            description,
            sort_order
        } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!category || !value || !label) {
            return res.status(400).json({
                success: false,
                message: 'category, value, and label are required'
            });
        }

        // ── Trim inputs ───────────────────────────────────────
        const cleanCategory = category.trim().toLowerCase();
        const cleanValue    = value.trim().toLowerCase().replace(/\s+/g, '_');
        const cleanLabel    = label.trim();

        // ── Duplicate Check ───────────────────────────────────
        // Same category + same value cannot exist twice
        const existing = await MasterLookup.findOne({
            where: {
                category: cleanCategory,
                value:    cleanValue
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `"${cleanLabel}" already exists in ${cleanCategory}`
            });
        }

        const master = await MasterLookup.create({
            category: cleanCategory,
            value: cleanValue,
            label: cleanLabel,
            description: description?.trim() || null,
            sort_order: sort_order || 0,
            is_active: true,
            created_by: req.user.id 
        })

        if (cleanCategory === 'phase') {
            const phaseExists = await Phase.findOne({
                where: { phase_name: cleanLabel }
            });
            if (!phaseExists) {
                await Phase.create({ phase_name: cleanLabel });
                console.log(`✅ Phase "${cleanLabel}" also created in phases table`);
            }
        }

        if (cleanCategory === 'vendor') {
            const { Vendor } = require('../models/index');
            const vendorExists = await Vendor.findOne({
                where: { vendor_name: cleanLabel }
            });
            if (!vendorExists) {
                await Vendor.create({ vendor_name: cleanLabel });
                console.log(`✅ Vendor "${cleanLabel}" also created in vendors table`);
            }
        }

        await AuditLog.create({
            performed_by: req.user.id,
            action:       'MASTER_CREATED',
            module:       'MASTER_MANAGEMENT',
            target_id:    master.id,
            target_type:  'MasterLookup',
            description:  `Master created: [${cleanCategory}] ${cleanLabel}`,
            ip_address:   req.ip
        });

        return res.status(201).json({
            success: true,
            message: `"${cleanLabel}" added to ${cleanCategory}`,
            data:    master
        });


    } catch (error) {
        console.error('[createMaster] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── UPDATE MASTER ─────────────────────────────────────────────
// PUT /admin/masters/:id
// Body: { label, description, sort_order }
// NOTE: category and value are NOT editable (integrity)

const updateMaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, description, sort_order } = req.body;

        if (!label?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'label is required'
            });
        }

        // ── Find Master ───────────────────────────────────────
        const master = await MasterLookup.findByPk(id);

        if (!master) {
            return res.status(404).json({
                success: false,
                message: 'Master not found'
            });
        }

        const oldLabel = master.label;

        // ── Update ────────────────────────────────────────────
        await master.update({
            label:       label.trim(),
            description: description?.trim() || master.description,
            sort_order:  sort_order !== undefined ? sort_order : master.sort_order
        });


        await AuditLog.create({
            performed_by: req.user.id,
            action:       'MASTER_UPDATED',
            module:       'MASTER_MANAGEMENT',
            target_id:    master.id,
            target_type:  'MasterLookup',
            description:  `Master updated: [${master.category}] "${oldLabel}" → "${label.trim()}"`,
            ip_address:   req.ip
        });

        return res.status(200).json({
            success: true,
            message: `"${label.trim()}" updated successfully`,
            data:    master
        });

    } catch (error) {
        console.error('[updateMaster] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── DELETE MASTER ─────────────────────────────────────────────
// DELETE /admin/masters/:id

const deleteMaster = async (req, res) => {
    try {
        const { id } = req.params;

        const master = await MasterLookup.findByPk(id);

        if (!master) {
            return res.status(404).json({
                success: false,
                message: 'Master not found'
            });
        }

        const { category, label } = master;

        await master.destroy();

        // ── Audit Log ─────────────────────────────────────────
        await AuditLog.create({
            performed_by: req.user.id,
            action:       'MASTER_DELETED',
            module:       'MASTER_MANAGEMENT',
            target_id:    parseInt(id),
            target_type:  'MasterLookup',
            description:  `Master deleted: [${category}] "${label}"`,
            ip_address:   req.ip
        });

        return res.status(200).json({
            success: true,
            message: `"${label}" deleted from ${category}`
        });

    } catch (error) {
        console.error('[deleteMaster] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ── TOGGLE MASTER STATUS ──────────────────────────────────────
// PATCH /admin/masters/:id/toggle

const toggleMasterStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const master = await MasterLookup.findByPk(id);

        if (!master) {
            return res.status(404).json({
                success: false,
                message: 'Master not found'
            });
        }

        await master.update({ is_active: !master.is_active });

        const statusText = master.is_active ? 'activated' : 'deactivated';

        // ── Audit Log ─────────────────────────────────────────
        await AuditLog.create({
            performed_by: req.user.id,
            action:       master.is_active ? 'MASTER_ACTIVATED' : 'MASTER_DEACTIVATED',
            module:       'MASTER_MANAGEMENT',
            target_id:    master.id,
            target_type:  'MasterLookup',
            description:  `Master ${statusText}: [${master.category}] "${master.label}"`,
            ip_address:   req.ip
        });

        return res.status(200).json({
            success:   true,
            message:   `"${master.label}" ${statusText}`,
            is_active: master.is_active
        });

    } catch (error) {
        console.error('[toggleMasterStatus] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getMasters,
    getMastersByCategory,
    createMaster,
    updateMaster,
    deleteMaster,
    toggleMasterStatus
};
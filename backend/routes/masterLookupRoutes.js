// routes/masterLookupRoutes.js
'use strict';

const express = require('express');
const router  = express.Router();

// ── Controller Import ─────────────────────────────────────────
const {
    getMasters,           // was wrongly called getAll
    getMastersByCategory, // was wrongly called getByCategory
    createMaster,         // was wrongly called create
    updateMaster,         // was wrongly called update
    deleteMaster,         // was wrongly called delete
    toggleMasterStatus    // was missing entirely from routes
} = require('../controllers/masterLookupController'); // ← file renamed to this

// ── Middleware Import ─────────────────────────────────────────
const { authenticate, isAdmin } = require('../middleware/auth');

// ── Debug / Test Route ────────────────────────────────────────
router.get('/testlookup', (req, res) => {
    res.json({
        success: true,
        message: 'Master Lookup Route Working'
    });
});

// ── Debug Logs ────────────────────────────────────────────────
console.log('Auth middleware:', typeof authenticate);
console.log('isAdmin middleware:', typeof isAdmin);
console.log('getMasters:', typeof getMasters);
console.log('getMastersByCategory:', typeof getMastersByCategory);
console.log('createMaster:', typeof createMaster);
console.log('updateMaster:', typeof updateMaster);
console.log('deleteMaster:', typeof deleteMaster);
console.log('toggleMasterStatus:', typeof toggleMasterStatus);

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES — All authenticated users
// ─────────────────────────────────────────────────────────────

// GET /lookups?category=location_type
// GET /lookups?category=priority&is_active=true
// GET /lookups?search=zone
router.get(
    '/lookups',
    authenticate,
    getMasters                // ← was masterLookupController.getByCategory (wrong)
);

// GET /lookups/:category  →  e.g. /lookups/location_type
router.get(
    '/lookups/:category',
    authenticate,
    getMastersByCategory      // ← replaces the missing getBulk
);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES — Admin only
// ─────────────────────────────────────────────────────────────

// GET /lookups/all  →  all masters with full details
router.get(
    '/lookups/all',
    authenticate,
    isAdmin,
    getMasters                // ← was masterLookupController.getAll (wrong)
);

// POST /lookups  →  create new master entry
router.post(
    '/lookups',
    authenticate,
    isAdmin,
    createMaster              // ← was masterLookupController.create (wrong)
);

// PUT /lookups/:id  →  update master entry
router.put(
    '/lookups/:id',
    authenticate,
    isAdmin,
    updateMaster              // ← was masterLookupController.update (wrong)
);

// DELETE /lookups/:id  →  delete master entry
router.delete(
    '/lookups/:id',
    authenticate,
    isAdmin,
    deleteMaster              // ← was masterLookupController.delete (wrong)
);

// PATCH /lookups/:id/toggle  →  activate / deactivate
// This route was completely MISSING from original file
router.patch(
    '/lookups/:id/toggle',
    authenticate,
    isAdmin,
    toggleMasterStatus        // ← was never added, now added
);

module.exports = router;
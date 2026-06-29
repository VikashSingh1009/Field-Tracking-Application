'use strict';

require('dotenv').config();

const { sequelize } = require('../config/database');


const User             = require('./User');
const Phase            = require('./Phase');
const Vendor           = require('./Vendor');
const ExcelUpload      = require('./ExcelUpload');
const SubActivity      = require('./SubActivity');
const Location         = require('./Location');
const LocationActivity = require('./LocationActivity');
const TaskUpdate       = require('./TaskUpdate');
const Notification     = require('./Notification');


const MasterLookup     = require('./MasterLookup'); // ← NEW
const AuditLog         = require('./AuditLog');      // ← NEW


User.belongsTo(User, { foreignKey: 'created_by', as: 'creator', constraints: false });
User.hasMany(User,   { foreignKey: 'created_by', as: 'created_users', constraints: false });

ExcelUpload.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(ExcelUpload,   { foreignKey: 'uploaded_by', as: 'uploads' });

Location.belongsTo(ExcelUpload, { foreignKey: 'upload_id', as: 'upload' });
ExcelUpload.hasMany(Location,   { foreignKey: 'upload_id', as: 'locations' });

Location.belongsTo(Phase, { foreignKey: 'phase_id', as: 'phase' });
Phase.hasMany(Location,   { foreignKey: 'phase_id', as: 'locations' });

Location.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(Location,   { foreignKey: 'vendor_id', as: 'locations' });

Location.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });
User.hasMany(Location,   { foreignKey: 'supervisor_id', as: 'supervised_locations' });

LocationActivity.belongsTo(Location,    { foreignKey: 'location_id',  as: 'location' });
Location.hasMany(LocationActivity,      { foreignKey: 'location_id',  as: 'activities' });

LocationActivity.belongsTo(SubActivity, { foreignKey: 'activity_id',  as: 'activity' });
SubActivity.hasMany(LocationActivity,   { foreignKey: 'activity_id',  as: 'location_activities' });

LocationActivity.belongsTo(User, { foreignKey: 'worker_id', as: 'worker' });
User.hasMany(LocationActivity,   { foreignKey: 'worker_id', as: 'tasks' });

TaskUpdate.belongsTo(LocationActivity, { foreignKey: 'location_activity_id', as: 'location_activity' });
LocationActivity.hasMany(TaskUpdate,   { foreignKey: 'location_activity_id', as: 'updates' });

TaskUpdate.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
User.hasMany(TaskUpdate,   { foreignKey: 'updated_by', as: 'task_updates' });

Notification.belongsTo(User, { foreignKey: 'to_user_id',   as: 'receiver' });
User.hasMany(Notification,   { foreignKey: 'to_user_id',   as: 'received_notifications' });

Notification.belongsTo(User, { foreignKey: 'from_user_id', as: 'sender',             constraints: false });
User.hasMany(Notification,   { foreignKey: 'from_user_id', as: 'sent_notifications', constraints: false });



// MasterLookup → User (creator)
MasterLookup.belongsTo(User, {
    foreignKey:  'created_by',
    as:          'creator',
    constraints: false
});

// AuditLog → User (performed_by)
AuditLog.belongsTo(User, {
    foreignKey: 'performed_by',
    as:         'performer'
});

// User → User (Worker ka Supervisor)
User.belongsTo(User, {
    foreignKey:  'supervisor_id',
    as:          'my_supervisor',
    constraints: false
});
User.hasMany(User, {
    foreignKey:  'supervisor_id',
    as:          'my_workers',
    constraints: false
});


const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected Successfully');
    } catch (error) {
        console.error('Database Connection Failed:', error.message);
        process.exit(1);
    }
};

const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: false, alter: false });
        console.log('All Tables Synced Successfully');
    } catch (error) {
        console.error('Table Sync Failed:', error.message);
        process.exit(1);
    }
};

const createDefaultAdmin = async () => {
    try {
        const bcrypt = require('bcryptjs');

        const adminExists = await User.findOne({
            where: { phone: '9999999999' }
        });

        if (!adminExists) {
            const passwordHash = await bcrypt.hash('admin@123', 10);
            await User.create({
                full_name:           'Super Admin',
                phone:               '9999999999',
                email:               'admin@fieldtrack.com',
                password_hash:       passwordHash,
                role:                'Admin',
                employee_id:         'ADMIN001',
                is_active:           true,
                is_password_set:     true,
                status:              'active',
                invite_token:        null,
                invite_token_expiry: null
            });
            console.log('Default Admin Created!');
            console.log('Phone:    9999999999');
            console.log('Password: admin@123');
        } else {
            console.log('Admin already exists');
        }
    } catch (error) {
        console.error('Admin Creation Failed:', error.message);
    }
};


module.exports = {
    sequelize,
    connectDB,
    syncDatabase,
    createDefaultAdmin,

    User,
    Phase,
    Vendor,
    ExcelUpload,
    SubActivity,
    Location,
    LocationActivity,
    TaskUpdate,
    Notification,

    
    MasterLookup,   
    AuditLog        
};
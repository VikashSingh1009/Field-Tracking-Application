// models/User.js
// COMPLETE CLEAN VERSION — All commas verified
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
    'User',
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
            allowNull:     false
        },

        full_name: {
            type:      DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull:  { msg: 'Name is required' },
                notEmpty: { msg: 'Name cannot be empty' }
            }
        },

        phone: {
            type:      DataTypes.STRING(20),
            allowNull: false,
            unique:    true,
            validate: {
                notNull:  { msg: 'Phone is required' },
                notEmpty: { msg: 'Phone cannot be empty' }
            }
        },

        email: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            unique:    true,
            validate: {
                isEmail: { msg: 'Enter valid email' }
            }
        },

        password_hash: {
            type:      DataTypes.STRING(255),
            allowNull: true
        },

        role: {
            type:      DataTypes.ENUM('Admin', 'Supervisor', 'Worker'),
            allowNull: false
        },

        employee_id: {
            type:      DataTypes.STRING(50),
            allowNull: true,
            unique:    true
        },

        is_active: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true
        },

        created_by: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },

        // ── SUPERVISOR ASSIGNMENT ─────────────────────────────
        // Worker → Supervisor link
        // Was MISSING from model, association existed in index.js
        supervisor_id: {
            type:      DataTypes.INTEGER,
            allowNull: true
        },

        // ── INVITE FLOW ───────────────────────────────────────
        invite_token: {
            type:      DataTypes.STRING(255),
            allowNull: true
        },

        invite_token_expiry: {
            type:      DataTypes.DATE,
            allowNull: true
        },

        is_password_set: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false
        },

        status: {
            type:         DataTypes.ENUM('pending', 'active', 'inactive'),
            defaultValue: 'pending'
        },

        // ── GOOGLE AUTH ───────────────────────────────────────
        google_id: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            unique:    true
        },

        // FIXED: was DataTypes.STRING('local','google') — wrong syntax
        // Now correctly using DataTypes.STRING(20)
        auth_source: {
            type:         DataTypes.STRING(20),
            defaultValue: 'local'
        },

        // ── PASSWORD RESET ────────────────────────────────────
        reset_password_token: {
            type:      DataTypes.STRING(255),
            allowNull: true
        },

        reset_password_expiry: {
            type:      DataTypes.DATE,
            allowNull: true
        }

    },
    {
        tableName:  'users',
        timestamps: false
    }
);

module.exports = User;
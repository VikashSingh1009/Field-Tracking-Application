

export const ENDPOINT = {

    // auth 
    AUTH: {
        LOGIN:           '/auth/login',
        ME:              '/auth/me',
        LOGOUT:          '/auth/logout',
        CHANGE_PASSWORD: '/auth/change-password',

        GOOGLE:         '/auth/google',
        FORGOT_PASSWORD:  '/auth/forgot-password',
        RESET_PASSWORD:   (token) => `/auth/reset-password/${token}`
    },

    // admin
    ADMIN: {
        // Dashboard
        DASHBOARD:          '/admin/dashboard',

        // Upload
        UPLOAD_EXCEL:       '/admin/upload/excel',
        UPLOAD_HISTORY:     '/admin/upload/history',
        UPLOAD_VIEW:        (id) => `/admin/upload/${id}/view`,

        // Notifications
        NOTIFICATIONS:      '/admin/notifications',
        NOTIFICATION_READ:  (id) => `/admin/notifications/${id}/read`,
        NOTIFICATIONS_ALL:  '/admin/notifications/read-all',

        // Users
        USERS:              '/admin/users',
        USER_BY_ID:         (id) => `/admin/users/${id}`,
        USER_TOGGLE:        (id) => `/admin/users/${id}/toggle-status`,

        // Locations
        LOCATIONS:          '/admin/locations',
        LOCATION_BY_ID:     (id) => `/admin/locations/${id}`,
        LOCATION_ASSIGN:    (id) => `/admin/locations/${id}/assign-supervisor`,

        // Activities
        ACTIVITIES:         '/admin/activities',
        ACTIVITY_BY_ID:     (id) => `/admin/activities/${id}`,

        // Reports
        REPORTS:            '/admin/reports',
        REPORTS_EXPORT:     '/admin/reports/export',

        // Evidence
        EVIDENCE:           '/admin/evidence',
    },

    // supervisor 
    SUPERVISOR: {
        DASHBOARD:          '/supervisor/dashboard',
        LOCATIONS:          '/supervisor/locations',
        LOCATION_BY_ID:     (id) => `/supervisor/locations/${id}`,
        ACTIVITIES:         '/supervisor/activities',
        ACTIVITY_BY_ID:     (id) => `/supervisor/activities/${id}`,
        ASSIGN_WORKER:      (id) => `/supervisor/activities/${id}/assign-worker`,
        UPDATE_ACTIVITY:    (id) => `/supervisor/activities/${id}/update`,
        WORKERS:            '/supervisor/workers',
        EVIDENCE:           '/supervisor/evidence',
        EVIDENCE_UPLOAD:    '/supervisor/evidence/upload',
        NOTIFICATIONS:      '/supervisor/notifications',
        NOTIFICATION_READ:  (id) => `/supervisor/notifications/${id}/read`,
    },

    // worker 
    WORKER: {
        DASHBOARD:          '/worker/dashboard',
        TASKS:              '/worker/tasks',
        TASK_BY_ID:         (id) => `/worker/tasks/${id}`,
        UPDATE_TASK:        (id) => `/worker/tasks/${id}/update`,
        EVIDENCE:           '/worker/evidence',
        NOTIFICATIONS:      '/worker/notifications',
        NOTIFICATION_READ:  (id) => `/worker/notifications/${id}/read`,
    },
};















// export const ENDPOINT = {
//     LOGIN: '/auth/login',
//     REGISTER: '/auth/register',
//     LOGOUT: '/auth/logout',
//     ME: '/auth/me',

//     // 
// }

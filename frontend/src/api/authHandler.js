import client from './client';
import { ENDPOINT } from './endpoint';

// LOGIN
// POST /api/auth/login


export const handleLogin = async (data) => {
    try {
        const response = await client.post(ENDPOINT.AUTH.LOGIN, data);
        // data = { phone: '9999999999', password: 'admin@123' }

        return response.data;
        // { success:true, token:'eyJhbG...', user:{...} }

    } catch (error) {
        const message = error?.response?.data?.message || 'Login failed. Please try again.';
        // error.response.data.message - Backend message
        // 'Invalid phone or password'
        // 'Account deactivated'
        // Fallback: Generic message

        throw new Error(message, { cause: error})
        // Login.jsx me catch karega:
        // setError(err.message) → UI me dikhega
    }
};

// GET ME (Apni profile)
// GET /api/auth/me


export const handleGetMe = async () => {
    try {
        const response = await client.get(ENDPOINT.AUTH.ME);
        // Token automatically attach hoga (client interceptor)

        return response.data;
        // { success:true, user: { id, full_name, role, ... } }

    } catch (error) {
        const message = error?.response?.data?.message
            || 'Failed to get user info.';
        throw new Error(message, {cause : error});
    }
};

// CHANGE PASSWORD
// PATCH /api/auth/change-password


export const handleChangePassword = async (data) => {
    try {
        const response = await client.patch(
            ENDPOINT.AUTH.CHANGE_PASSWORD,
            data
        );
        // data = { old_password: '...', new_password: '...' }

        return response.data;
        // { success:true, message:'Password changed successfully' }

    } catch (error) {
        const message = error?.response?.data?.message
            || 'Password change failed.';
        throw new Error(message, {cause: error});
    }
};

// LOGOUT
// POST /api/auth/logout

export const handleLogout = async () => {
    try {
        await client.post(ENDPOINT.AUTH.LOGOUT);
        // Server ko inform karo (optional — JWT stateless)

    } catch (error) {
        // Logout me error ignore karo
        // Server down bhi ho toh logout karna zaroori hai
        console.log('Logout API error (ignored):', error.message);

    } finally {
        //  clear localstorage
        localStorage.clear();
    }
};


// google auth new 
export const handleGoogleAuth = async ({ access_token }) => {
    try {
        const response = await client.post(ENDPOINT.AUTH.GOOGLE, { access_token });
        return response.data;
    } catch (error) {
        const message = error?.response?.data?.message || 'Google login failed.';
        throw new Error(message, { cause: error });
    }
};


// forgot password 
export const handleForgotPassword = async ({ email }) => {
    try {
        const response = await client.post(ENDPOINT.AUTH.FORGOT_PASSWORD, { email });
        return response.data;
    } catch (error) {
        const message = error?.response?.data?.message || 'Request failed. Please try again.';
        throw new Error(message, { cause: error });
    }
};


// Reset Password 
export const handleResetPassword = async ({ token, password, confirmPassword}) => {
    try {
        const response = await client.post(
            ENDPOINT.AUTH.RESET_PASSWORD(token), {
                password, confirmPassword
            }
        );
        return response.data;
    } catch (error){
        const message = error?.response?.data?.message || 'Reset failed. Please try again.';
        throw new Error(message, {cause: error});
    }
}

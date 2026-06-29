import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/client';

const SetPassword = () => {
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const token             = searchParams.get('token');

    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading]                 = useState(false);
    const [error, setError]                     = useState('');
    const [success, setSuccess]                 = useState('');

    //  Token nahi mila URL mein
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow text-center">
                    <p className="text-red-500 text-lg font-semibold">
                         Invalid Link!
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Ask to admin set link again
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Frontend Validation
        if (password !== confirmPassword) {
            return setError("Passwords don't match!");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters!");
        }

        setLoading(true);
        try {
            const res = await API.post('/auth/set-password', {
                token,
                password,
                confirmPassword
            });

            setSuccess(res.data.message || "Password set successfully!");

            // After 2 second move on login
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center 
                        justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg 
                            w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-600">
                         Set Your Password
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Create a password for your account
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-100 text-green-700 p-3 
                                    rounded-lg mb-4 text-center text-sm">
                         {success} <br/>
                        <span className="text-xs">
                            Redirecting to login...
                        </span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 
                                    rounded-lg mb-4 text-center text-sm">
                         {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold 
                                          text-gray-600 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full border border-gray-300 
                                       rounded-lg px-4 py-2.5 text-sm
                                       focus:outline-none focus:ring-2 
                                       focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold 
                                          text-gray-600 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full border border-gray-300 
                                       rounded-lg px-4 py-2.5 text-sm
                                       focus:outline-none focus:ring-2 
                                       focus:ring-blue-400"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 
                                   text-white font-semibold py-2.5 
                                   rounded-lg transition duration-200
                                   disabled:opacity-50"
                    >
                        {loading 
                            ? ' Setting Password...' 
                            : ' Set Password & Activate Account'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
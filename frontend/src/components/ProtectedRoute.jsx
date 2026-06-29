import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    
    const { user, role, loading } = useAuth();

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );



    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;  
    return children;
};

export default ProtectedRoute;
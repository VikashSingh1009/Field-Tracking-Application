import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser){ 
                setUser(JSON.parse(storedUser));
            }
        } catch { 
            localStorage.clear(); 
        }
        finally{
            setLoading(false);
        }
        
    }, []);


    const login = (userData, token) => {
        // localStorage me save karo (refresh ke liye)
        localStorage.setItem('user',  JSON.stringify(userData));
        localStorage.setItem('token', token);

        // State immediately update karo
        // (Page refresh ki zaroorat nahi ab)
        setUser(userData);
    };

    const logout = () => { 
        localStorage.clear(); 
        window.location.href = '/login'; 
    };
    const role = user?.role || '';

    return (
        <AuthContext.Provider value={{ user, loading, logout, role, login,
            isAdmin: role === 'Admin', isSupervisor: role === 'Supervisor', isWorker: role === 'Worker'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
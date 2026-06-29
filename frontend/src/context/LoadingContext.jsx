import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useCallback((path) => {
    setIsLoading(true);
    // Small delay before navigating for smooth transition
    setTimeout(() => {
      navigate(path);
      setTimeout(() => setIsLoading(false), 600);
    }, 100);
  }, [navigate]);

  return (
    <LoadingContext.Provider value={{ navigateTo, isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};
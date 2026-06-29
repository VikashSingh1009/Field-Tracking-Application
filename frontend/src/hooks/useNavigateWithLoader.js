// hooks/useNavigateWithLoader.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigateWithLoader = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useCallback(async (to, options) => {
    setIsLoading(true);
    try {
      navigate(to, options);
    } finally {
      // Delay to ensure page loads before hiding spinner
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [navigate]);

  return { navigateTo, isLoading };
};
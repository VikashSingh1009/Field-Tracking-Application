import { useLoading } from '../context/LoadingContext';
import Spinner from './ui/Spinner';

const NavigationLoader = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
      <Spinner centered text="Loading..." />
    </div>
  );
};

export default NavigationLoader;
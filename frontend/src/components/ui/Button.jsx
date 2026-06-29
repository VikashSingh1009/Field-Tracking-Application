import { Loader2 } from "lucide-react";

const Button = ({ type = "submit", loading, children, onClick, className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`
        w-full py-4 px-6 rounded-2xl font-bold text-[14px] tracking-tight
        flex items-center justify-center gap-2.5
        transition-all duration-200
        ${loading
          ? "bg-violet-300 cursor-not-allowed"
          : "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 active:scale-[0.98] shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
        }
        text-white
        ${className}
      `}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;





// import { forwardRef } from 'react';

// const Button = forwardRef(({ 
//   children, 
//   loading, 
//   variant = 'primary', 
//   className = '', 
//   disabled, 
//   type,
//   ...props 
// }, ref) => {
//   const baseStyles = 'py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors w-full';
  
//   const variants = {
//     primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white',
//     secondary: 'bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800',
//     outline: 'border border-slate-200 hover:border-slate-300 text-slate-700 disabled:opacity-50',
//   };

//   return (
//     <button
//       ref={ref} 
//       type= {type}
//       disabled={disabled || loading}
//       className={`${baseStyles} ${variants[variant]} ${className}`}
//       {...props}
//     >
//       {loading ? (
//         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//       ) : (
//         children
//       )}
//     </button>
//   );
// });

// Button.displayName = 'Button';


// export default Button;

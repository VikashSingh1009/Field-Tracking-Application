import { useState } from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  rightElement,
  maxLength,
  inputMode,
  autoComplete,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div
        className={`
          relative flex items-center rounded-xl border-2 transition-all duration-200
          ${focused
            ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
            : error
              ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.06)]"
              : "border-slate-200 hover:border-slate-300"
          }
          bg-white
        `}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete || "off"}
          className="w-full px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none rounded-xl"
          {...rest}
        />
        {rightElement && (
          <div className="pr-4 flex-shrink-0">{rightElement}</div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;



// import React, { forwardRef } from 'react';

// const Input = forwardRef(({ 
//   label, 
//   error, 
//   rightElement, 
//   className = '', 
//   id, 
//   ...props 
// }, ref) => {
//   const inputId = id || React.useId();

//   return (
//     <div className={className}>
//       {label && (
//         <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 mb-1.5">
//           {label}
//         </label>
//       )}
//       <div className="relative">
//         <input
//           id={inputId}
//           ref={ref}
//           className={`w-full px-3.5 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
//             ${error
//               ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
//               : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
//             }`}
//           {...props}
//         />
//         {rightElement && (
//           <div className="absolute right-3 top-1/2 -translate-y-1/2">
//             {rightElement}
//           </div>
//         )}
//       </div>

//       {error && (
//         <div className="flex items-center gap-1.5 mt-1.5 animate-pulse">
//           <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//           </svg>
//           <span className="text-red-500 text-[11px] font-medium">{error}</span>
//         </div>
//       )}
//     </div>
//   );
// });

// Input.displayName = 'Input';

// export default Input;

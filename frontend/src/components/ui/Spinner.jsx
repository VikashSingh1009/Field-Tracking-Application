import { Loader2 } from "lucide-react";

const Spinner = ({ size = 24, className = "", text, centered = false }) => {
  const spinner = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader2 size={size} className="animate-spin text-violet-500" />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse shadow-xl shadow-violet-500/30" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-[3px] border-white animate-bounce shadow-lg shadow-emerald-400/50" />
        </div>
        {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
      </div>
    );
  }

  return spinner;
};

export default Spinner;

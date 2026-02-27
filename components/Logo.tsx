import { Activity } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Activity size={28} className="text-emerald-500" />
      <span className="text-xl font-bold white:text-black dark:text-white-color">
        Pulse<span className="text-emerald-500 dark:text-emerald-500">Ops</span>
      </span>
    </div>
  );
};

export default Logo;
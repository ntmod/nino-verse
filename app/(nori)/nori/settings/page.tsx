"use client";

import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Settings, 
  Tags, 
  CreditCard, 
  Target, 
  CalendarClock, 
  ChevronRight 
} from "lucide-react";

const SETTINGS_OPTIONS = [
  { 
    name: "Categories", 
    desc: "Manage your spending categories and icons", 
    path: "/nori/settings/category", 
    icon: Tags,
    color: "#FF9D00"
  },
  { 
    name: "Payment Methods", 
    desc: "Link card, cash, or digital wallets", 
    path: "/nori/settings/method", 
    icon: CreditCard,
    color: "#6366f1"
  },
  { 
    name: "Budgets", 
    desc: "Set monthly limits per category", 
    path: "/nori/settings/budget", 
    icon: Target,
    color: "#10b981"
  },
  { 
    name: "Fixed Costs", 
    desc: "Manage recurring bills and subscriptions", 
    path: "/nori/settings/fixed-cost", 
    icon: CalendarClock,
    color: "#f43f5e"
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setShowExitWipe(false);
    setPendingPath(null);
  }, [pathname]);

  const handleNavigate = (path: string) => {
    setPendingPath(path);
    setShowExitWipe(true);
    setTimeout(() => {
      router.push(path);
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#F8F9FA] flex flex-col items-center p-8 pt-24 pb-20">
      <LoadingScreenIn />
      {showExitWipe && <LoadingScreenOut />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
            <Settings className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Systems Settings</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure your expense tracking environment</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {SETTINGS_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => handleNavigate(option.path)}
                className="w-full p-6 rounded-3xl bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300 flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: `${option.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: option.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 italic uppercase">{option.name}</h3>
                    <p className="text-xs font-medium text-slate-400">{option.desc}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-black/5 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all">
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

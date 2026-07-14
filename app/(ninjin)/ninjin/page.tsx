'use client'

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  Coins, 
  Plus, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Activity, 
  BookOpen, 
  HeartHandshake, 
  Moon,
  PlusCircle,
  Gift
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LoadingScreen from "@/components/LoadingScreen";
import BackComponent from "@/components/BackComponent";

// Default Initial Data
const DEFAULT_STATS = {
  level: 1,
  xp: 35,
  fishCoins: 15,
  purrPower: 50,
  agility: 30,
  curiosity: 40,
  meowgility: 20
};

const DEFAULT_QUESTS = [
  {
    id: "q1",
    name: "Sunbathing (Morning Meditation)",
    type: "Daily Patrol",
    attribute: "purrPower",
    difficulty: "Easy",
    completed: false,
    xpReward: 10,
    coinReward: 5
  },
  {
    id: "q2",
    name: "Hunt the Red Dot (Gym Workout)",
    type: "Mouse Hunt",
    attribute: "agility",
    difficulty: "Medium",
    completed: false,
    xpReward: 20,
    coinReward: 10
  },
  {
    id: "q3",
    name: "Read 10 pages of Wisdom (Intellect)",
    type: "Mouse Hunt",
    attribute: "curiosity",
    difficulty: "Medium",
    completed: false,
    xpReward: 20,
    coinReward: 10
  }
];

const DEFAULT_REWARDS = [
  {
    id: "r1",
    name: "🥫 1x Canned Tuna (30-min Social Media)",
    cost: 15
  },
  {
    id: "r2",
    name: "🌿 Premium Catnip (Watch an Episode of Anime)",
    cost: 25
  },
  {
    id: "r3",
    name: "👑 The Golden Box (Order cheat meal / Takeout)",
    cost: 100
  }
];

export default function NinjinQuestPage() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [quests, setQuests] = useState(DEFAULT_QUESTS);
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states for adding Quest
  const [showAddQuestModal, setShowAddQuestModal] = useState(false);
  const [newQuestName, setNewQuestName] = useState("");
  const [newQuestType, setNewQuestType] = useState("Mouse Hunt");
  const [newQuestAttribute, setNewQuestAttribute] = useState("curiosity");
  const [newQuestDifficulty, setNewQuestDifficulty] = useState("Easy");

  // Form states for adding Reward
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardCost, setNewRewardCost] = useState(20);

  // Level Up Modal
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem("ninjin_stats");
    const savedQuests = localStorage.getItem("ninjin_quests");
    const savedRewards = localStorage.getItem("ninjin_rewards");

    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedQuests) setQuests(JSON.parse(savedQuests));
    if (savedRewards) setRewards(JSON.parse(savedRewards));

    setIsLoaded(true);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ninjin_stats", JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ninjin_quests", JSON.stringify(quests));
    }
  }, [quests, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ninjin_rewards", JSON.stringify(rewards));
    }
  }, [rewards, isLoaded]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add a Quest
  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestName.trim()) return;

    let xpReward = 10;
    let coinReward = 5;
    if (newQuestDifficulty === "Medium") {
      xpReward = 20;
      coinReward = 10;
    } else if (newQuestDifficulty === "Hard") {
      xpReward = 50;
      coinReward = 25;
    }

    const newQuest = {
      id: `q-${Date.now()}`,
      name: newQuestName,
      type: newQuestType,
      attribute: newQuestAttribute,
      difficulty: newQuestDifficulty,
      completed: false,
      xpReward,
      coinReward
    };

    setQuests([...quests, newQuest]);
    setNewQuestName("");
    setShowAddQuestModal(false);
    triggerToast("🐾 New Quest Posted to the Patrol Board!");
  };

  // Delete a Quest
  const handleDeleteQuest = (id: string) => {
    setQuests(quests.filter(q => q.id !== id));
    triggerToast("🗑️ Quest discarded.");
  };

  // Complete a Quest
  const handleCompleteQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;

    // Mark completed
    setQuests(quests.map(q => q.id === id ? { ...q, completed: true } : q));

    // Calculate new stats
    let newXp = stats.xp + quest.xpReward;
    let newLevel = stats.level;
    let didLevelUp = false;

    if (newXp >= 100) {
      newXp -= 100;
      newLevel += 1;
      didLevelUp = true;
    }

    // Boost the specific attribute
    const attributeBoost = quest.difficulty === "Easy" ? 3 : quest.difficulty === "Medium" ? 6 : 12;

    setStats(prev => ({
      ...prev,
      level: newLevel,
      xp: newXp,
      fishCoins: prev.fishCoins + quest.coinReward,
      [quest.attribute]: Math.min(100, prev[quest.attribute as keyof typeof prev] as number + attributeBoost)
    }));

    if (didLevelUp) {
      setTimeout(() => setShowLevelUp(true), 600);
    } else {
      triggerToast(`🏆 Quest Complete! +${quest.xpReward} XP, +${quest.coinReward} Fish Coins!`);
    }
  };

  // Add a Custom Reward
  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardName.trim()) return;

    const newReward = {
      id: `r-${Date.now()}`,
      name: newRewardName,
      cost: newRewardCost
    };

    setRewards([...rewards, newReward]);
    setNewRewardName("");
    setNewRewardCost(20);
    setShowAddRewardModal(false);
    triggerToast("🍖 Custom reward added to The Pantry!");
  };

  // Purchase a Reward
  const handleClaimReward = (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return;

    if (stats.fishCoins < reward.cost) {
      triggerToast("❌ Not enough Fish Coins! Go complete more Patrols!");
      return;
    }

    setStats(prev => ({
      ...prev,
      fishCoins: prev.fishCoins - reward.cost
    }));

    triggerToast(`🎉 Reward Claimed! Enjoy your "${reward.name}"!`);
  };

  const handleResetQuestSystem = () => {
    if (confirm("Are you sure you want to reset Ninjin's adventure? This resets all stats, gold, and custom quests.")) {
      setStats(DEFAULT_STATS);
      setQuests(DEFAULT_QUESTS);
      setRewards(DEFAULT_REWARDS);
      triggerToast("🔄 Ninjin Quest has been reset.");
    }
  };

  // Helper to map attribute keys to readable strings/icons
  const getAttrDetails = (key: string) => {
    switch (key) {
      case "purrPower":
        return { name: "Purr-power", color: "bg-emerald-500", icon: <Moon className="w-3.5 h-3.5" /> };
      case "agility":
        return { name: "Agility", color: "bg-blue-500", icon: <Activity className="w-3.5 h-3.5" /> };
      case "curiosity":
        return { name: "Curiosity", color: "bg-[#FF9D00]", icon: <BookOpen className="w-3.5 h-3.5" /> };
      case "meowgility":
      default:
        return { name: "Meow-gility", color: "bg-purple-500", icon: <HeartHandshake className="w-3.5 h-3.5" /> };
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8 pt-16 md:pt-24 pb-20">
      <LoadingScreen mode="in" />
      <BackComponent variant="light" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-[100] bg-slate-900 border border-white/10 px-5 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Splash */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="text-center max-w-sm space-y-6 flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                <Image src="/animations/ninjin-intro.gif" alt="Level Up" width={140} height={140} className="relative rounded-full border-4 border-[#FF9D00]" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-[#FF9D00] uppercase tracking-[0.3em] flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  LEVEL UP!
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                  Ninjin reached Level {stats.level}!
                </h2>
                <p className="text-xs text-slate-400 max-w-xs font-bold leading-relaxed pt-2">
                  Congratulations! Ninjin is growing stronger and wiser. Go check out the pantry for your unlocked rewards!
                </p>
              </div>
              <button 
                onClick={() => setShowLevelUp(false)}
                className="w-full py-4 bg-[#FF9D00] text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Continue Adventure
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl w-full flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/nori" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors mb-2 text-[10px] font-bold uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3" />
              Nino-Verse Hub
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF9D00]/10 rounded-2xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF9D00] animate-bounce" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                Ninjin Quest<span className="text-[#FF9D00]">.</span>
              </h1>
            </div>
          </div>
          <button 
            onClick={handleResetQuestSystem}
            className="text-[9px] font-bold text-slate-600 hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Reset Adventure
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Character Stats & The Pantry (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Feline Character Sheet */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF9D00]/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Image 
                    src="/animations/ninjin-intro.gif" 
                    alt="Ninjin" 
                    width={76} 
                    height={76} 
                    className="rounded-2xl border border-white/10 bg-slate-800 object-cover" 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#FF9D00] text-slate-950 font-black text-[9px] w-6 h-6 rounded-lg flex items-center justify-center border-2 border-slate-900 shadow">
                    Lvl {stats.level}
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-black tracking-tight text-white leading-none">Ninjin the Orange Cat</h2>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">Adventurer Mode</span>
                  <div className="flex items-center gap-1.5 mt-2 bg-[#FF9D00]/15 text-[#FF9D00] px-2 py-0.5 rounded-lg w-fit text-[9px] font-black">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{stats.fishCoins} Fish Coins</span>
                  </div>
                </div>
              </div>

              {/* XP Level Bar */}
              <div className="mt-6 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Experience Points</span>
                  <span>{stats.xp}/100 XP</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-[#FF9D00]"
                    animate={{ width: `${stats.xp}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Attributes Progress Bars */}
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feline Attributes</h3>
                
                {["purrPower", "agility", "curiosity", "meowgility"].map(attrKey => {
                  const details = getAttrDetails(attrKey);
                  const val = stats[attrKey as keyof typeof stats] as number;
                  
                  return (
                    <div key={attrKey} className="space-y-1 group">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white transition-colors">
                          <span className="text-slate-500">{details.icon}</span>
                          <span>{details.name}</span>
                        </div>
                        <span className="text-slate-300 font-bold">{val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${details.color}`}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The Pantry (Rewards Store) */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black tracking-tight uppercase italic text-white">The Pantry</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Claim rewards for fish coins</p>
                </div>
                <button 
                  onClick={() => setShowAddRewardModal(true)}
                  className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center hover:bg-slate-800 hover:border-white/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Rewards List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {rewards.map(reward => {
                  const canAfford = stats.fishCoins >= reward.cost;
                  return (
                    <div key={reward.id} className="bg-slate-950 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2 group">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{reward.name}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Cost: {reward.cost} Fish Coins</span>
                      </div>
                      <button 
                        onClick={() => handleClaimReward(reward.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                          canAfford 
                            ? "bg-[#FF9D00] text-slate-950 hover:scale-105 active:scale-95" 
                            : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                        }`}
                      >
                        Claim
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Quest Board (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white leading-none uppercase italic">Active Patrols</h2>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Complete patrols to unlock loot & power up Ninjin</p>
              </div>
              <button
                onClick={() => setShowAddQuestModal(true)}
                className="px-4 py-2 bg-[#FF9D00] text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Post Quest
              </button>
            </div>

            {/* Quests Display */}
            <div className="space-y-3 min-h-[300px]">
              {quests.filter(q => !q.completed).length === 0 ? (
                <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-slate-850 rounded-2xl flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">All Patrols Secured!</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1">Post a new quest to get started</p>
                </div>
              ) : (
                quests.filter(q => !q.completed).map(quest => {
                  const details = getAttrDetails(quest.attribute);
                  return (
                    <motion.div 
                      key={quest.id}
                      layoutId={quest.id}
                      className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Complete Checkbox */}
                        <button 
                          onClick={() => handleCompleteQuest(quest.id)}
                          className="w-6 h-6 rounded-lg border border-white/15 hover:border-[#FF9D00] hover:bg-[#FF9D00]/10 flex items-center justify-center transition-all cursor-pointer group-hover:scale-105 active:scale-90"
                        >
                          <Check className="w-3.5 h-3.5 text-transparent hover:text-[#FF9D00] transition-colors" />
                        </button>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-200">{quest.name}</span>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-900 border border-white/5 px-1.5 py-0.5 rounded">
                              {quest.type}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${details.color}`} />
                              {details.name}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                              🏆 +{quest.xpReward} XP / +{quest.coinReward} Coins
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Completed Quests section */}
            {quests.filter(q => q.completed).length > 0 && (
              <div className="pt-6 border-t border-white/5 space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Completed Adventures</h3>
                <div className="space-y-2 opacity-55">
                  {quests.filter(q => q.completed).slice(0, 3).map(quest => (
                    <div key={quest.id} className="bg-slate-950 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 line-through text-left">{quest.name}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#FF9D00]">COMPLETED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Add Quest Modal */}
      <AnimatePresence>
        {showAddQuestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 text-left shadow-2xl"
            >
              <div>
                <h3 className="text-base font-black uppercase tracking-tight italic text-white">Post Feline Patrol</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Assign a quest for Ninjin to tackle</p>
              </div>

              <form onSubmit={handleAddQuest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Quest Name (Real-life task)</label>
                  <input 
                    type="text" 
                    value={newQuestName}
                    onChange={(e) => setNewQuestName(e.target.value)}
                    placeholder="e.g. Study Coding for 1 hour"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF9D00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Quest Type</label>
                    <select 
                      value={newQuestType}
                      onChange={(e) => setNewQuestType(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
                    >
                      <option value="Daily Patrol">Daily Patrol (Habit)</option>
                      <option value="Mouse Hunt">Mouse Hunt (To-Do)</option>
                      <option value="Catnip Raid">Catnip Raid (Milestone)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stat Boost</label>
                    <select 
                      value={newQuestAttribute}
                      onChange={(e) => setNewQuestAttribute(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
                    >
                      <option value="curiosity">Curiosity (Intellect)</option>
                      <option value="agility">Agility (Strength)</option>
                      <option value="purrPower">Purr-power (Vitality)</option>
                      <option value="meowgility">Meow-gility (Social)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Difficulty / Rewards</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Easy", "Medium", "Hard"].map(diff => {
                      const selected = newQuestDifficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setNewQuestDifficulty(diff)}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                            selected 
                              ? "bg-[#FF9D00] text-slate-950 border-[#FF9D00]" 
                              : "bg-slate-950 text-slate-400 border-white/5"
                          }`}
                        >
                          {diff}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddQuestModal(false)}
                    className="flex-1 py-3 bg-slate-950 border border-white/5 text-slate-400 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-[#FF9D00] text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Post Patrol
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Reward Modal */}
      <AnimatePresence>
        {showAddRewardModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 text-left shadow-2xl"
            >
              <div>
                <h3 className="text-base font-black uppercase tracking-tight italic text-white">Stock The Pantry</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Add custom treats to the pantry</p>
              </div>

              <form onSubmit={handleAddReward} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reward Name (Real-life treats)</label>
                  <input 
                    type="text" 
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                    placeholder="e.g. 🍨 Order Ice Cream"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF9D00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cost in Fish Coins</label>
                  <input 
                    type="number" 
                    value={newRewardCost}
                    onChange={(e) => setNewRewardCost(Number(e.target.value))}
                    placeholder="e.g. 30"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF9D00]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddRewardModal(false)}
                    className="flex-1 py-3 bg-slate-950 border border-white/5 text-slate-400 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-[#FF9D00] text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Stock Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
"use client";
import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, X, ChevronDown, ChevronUp } from "lucide-react";
import { useModal } from "@/lib/modal-context";

export default function FixedCostSettings() {
  const router = useRouter();
  const { openGlobalModal } = useModal();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [newCost, setNewCost] = useState({ name: "", amount: "", category: "", paymentMethod: "" });
  const [categories, setCategories] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);

  useEffect(() => {
    fetchFixedCosts();
    fetchCategories();
    fetchMethods();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/nori/category");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/nori/method");
      if (res.ok) setMethods(await res.json());
    } catch (err) {
      console.error("Failed to fetch methods:", err);
    }
  };

  const fetchFixedCosts = async () => {
    try {
      const res = await fetch("/api/nori/fixed-cost");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFixedCosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch fixed costs:", err);
    }
  };

  const handleSaveFixedCost = async () => {
    if (!newCost.name || !newCost.amount) return;
    try {
      const url = editingCost 
        ? `/api/nori/fixed-cost/${editingCost._id}` 
        : "/api/nori/fixed-cost";
      const fetchMethod = editingCost ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: fetchMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCost,
          amount: Number(newCost.amount)
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCost(null);
        setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
        fetchFixedCosts();
      }
    } catch (err) {
      console.error("Failed to save fixed cost:", err);
    }
  };

  const handleDeleteFixedCost = (id: string) => {
    openGlobalModal({
      header: "Delete Bill?",
      message: "Are you sure you want to remove this recurring bill? This action cannot be undone.",
      type: "danger",
      mainButton: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/fixed-cost/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchFixedCosts();
            }
          } catch (err) {
            console.error("Failed to delete fixed cost:", err);
          }
        },
        color: "bg-rose-500 hover:bg-rose-600 text-white"
      },
      subButton: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const handleMove = async (cost: any, direction: "up" | "down") => {
    const index = fixedCosts.findIndex(c => c._id === cost._id);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fixedCosts.length - 1) return;

    const newCosts = [...fixedCosts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newCosts[index], newCosts[targetIndex]] = [newCosts[targetIndex], newCosts[index]];

    setFixedCosts(newCosts);

    try {
      await fetch("/api/nori/fixed-cost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orders: newCosts.map((c, i) => ({ id: c._id, order: i })) 
        }),
      });
    } catch (err) {
      console.error("Failed to save new order:", err);
    }
  };

  const handleBack = () => {
    setShowExitWipe(true);
    setTimeout(() => {
      router.push("/nori/settings");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#F8F9FA] flex flex-col items-center p-8 pt-24 pb-20">
      <LoadingScreenIn />
      {showExitWipe && <LoadingScreenOut />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Fixed Costs</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your recurring subscriptions</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Bill
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {fixedCosts.map((cost, index) => (
              <motion.div
                key={cost._id || index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 md:p-6 rounded-3xl bg-white border border-black/5 flex items-center justify-between group select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5 -ml-1">
                    <button 
                      onClick={() => handleMove(cost, "up")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMove(cost, "down")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 text-2xl bg-slate-50"
                    >
                      🧾
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 italic uppercase">{cost.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{cost.category || "No Category"} • {cost.paymentMethod || "No Method"}</p>
                      <p className="text-sm font-black text-[#FF9D00] italic mt-1">{Number(cost.amount).toLocaleString()} THB / MONTH</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingCost(cost);
                      setNewCost({ name: cost.name, amount: cost.amount.toString(), category: cost.category || "", paymentMethod: cost.paymentMethod || "" });
                      setIsModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-white hover:shadow-md transition-all group/btn cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-slate-400 group-hover/btn:text-[#FF9D00]" />
                  </button>
                  <button 
                    onClick={() => handleDeleteFixedCost(cost._id)}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all group/btn cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-rose-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NEW/EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingCost(null);
                setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
              }}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
                    {editingCost ? "Edit Bill" : "Add Bill"}
                  </h2>
                  <button onClick={() => {
                    setIsModalOpen(false);
                    setEditingCost(null);
                    setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
                  }} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">


                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apartment Rent"
                      value={newCost.name}
                      onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Amount</label>
                    <input
                      type="number"
                      placeholder="e.g. 8500"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <div className="relative">
                      <select
                        value={newCost.category}
                        onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.filter(c => c.type === 'expense').map(cat => (
                          <option key={cat._id} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <div className="relative">
                      <select
                        value={newCost.paymentMethod}
                        onChange={(e) => setNewCost({ ...newCost, paymentMethod: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Method</option>
                        {methods.map(method => (
                          <option key={method._id} value={method.name}>{method.icon} {method.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingCost(null);
                      setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
                    }}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFixedCost}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    {editingCost ? "Update Bill" : "Save Bill"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}


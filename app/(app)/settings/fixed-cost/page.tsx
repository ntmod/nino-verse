"use client";
import { useLanguage } from "@/lib/language-context";

import LoadingScreen from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, X, ChevronDown, ChevronUp } from "lucide-react";
import { useModal } from "@/lib/modal-context";

export default function FixedCostSettings() {
  const { t } = useLanguage();
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

        openGlobalModal({
          header: t("ui_save_completed"),
          message: t("ui_the_fixed_cost_bill_has_been_saved_successfully"),
          type: "success",
          mainButton: {
            label: t("close"),
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to save fixed cost:", err);
    }
  };

  const handleDeleteFixedCost = (id: string) => {
    openGlobalModal({
      header: t("ui_delete_bill"),
      message: t("ui_are_you_sure_you_want_to_remove_this_recurring_bill_this_action_cannot_be_undone"),
      type: "danger",
      mainButton: {
        label: t("ui_yes_delete"),
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/fixed-cost/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchFixedCosts();
              setTimeout(() => {
                openGlobalModal({
                  header: t("ui_delete_completed"),
                  message: t("ui_the_fixed_cost_bill_has_been_removed_successfully"),
                  type: "success",
                  mainButton: {
                    label: t("close"),
                    onClick: () => {}
                  }
                });
              }, 300);
            }
          } catch (err) {
            console.error("Failed to delete fixed cost:", err);
          }
        },
        color: "bg-rose-500 hover:bg-rose-600 text-white"
      },
      subButton: {
        label: t("cancel"),
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
      router.push("/settings");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#f5f0e5] flex flex-col items-center px-4 sm:px-6 py-8 pt-24 pb-28">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex flex-wrap gap-4 items-center justify-between mb-12">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button aria-label={t("back")}
              onClick={handleBack}
              className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#7f715d]" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#292722] italic tracking-tighter uppercase">{t("settings_fixed_costs")}</h1>
              <p className="text-xs font-bold text-[#7f715d] uppercase tracking-widest">{t("ui_manage_your_recurring_subscriptions")}</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("ui_add_bill")}
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
                className="p-4 md:p-4 sm:p-6 rounded-none bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] flex flex-wrap gap-3 items-center justify-between group select-none"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex flex-col gap-0.5 -ml-1">
                    <button aria-label={t("move_up")}
                      onClick={() => handleMove(cost, "up")}
                      className="p-1 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button aria-label={t("move_down")}
                      onClick={() => handleMove(cost, "down")}
                      className="p-1 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
                    <div
                      className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center text-2xl bg-[#fffdf5]"
                    >
                      🧾
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black text-[#292722] italic uppercase">{cost.name}</h3>
                      <p className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest mt-0.5">{cost.category || t("ui_no_category")} • {cost.paymentMethod || t("ui_no_method")}</p>
                      <p className="text-sm font-black text-[#b97423] italic mt-1">{Number(cost.amount).toLocaleString()} {t("ui_thb_month")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button aria-label={t("edit")}
                    onClick={() => {
                      setEditingCost(cost);
                      setNewCost({ name: cost.name, amount: cost.amount.toString(), category: cost.category || "", paymentMethod: cost.paymentMethod || "" });
                      setIsModalOpen(true);
                    }}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-all group/btn cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-[#7f715d] group-hover/btn:text-[#b97423]" />
                  </button>
                  <button aria-label={t("delete")}
                    onClick={() => handleDeleteFixedCost(cost._id)}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-rose-50 transition-all group/btn cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#7f715d] group-hover/btn:text-rose-500" />
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
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingCost(null);
                setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
              }}
              className="absolute inset-0 bg-[#292722]/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-h-[85dvh] relative w-full max-w-lg bg-[#fffdf5] rounded-none shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-[#292722] italic uppercase tracking-tighter">
                    {editingCost ? t("ui_edit_bill") : t("ui_add_bill")}
                  </h2>
                  <button aria-label={t("close")} onClick={() => {
                    setIsModalOpen(false);
                    setEditingCost(null);
                    setNewCost({ name: "", amount: "", category: "", paymentMethod: "" });
                  }} className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-[#7f715d]" />
                  </button>
                </div>

                <div className="space-y-6">


                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_bill_name")}</label>
                    <input
                      type="text"
                      placeholder={t("ui_e_g_apartment_rent")}
                      value={newCost.name}
                      onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_monthly_amount")}</label>
                    <input
                      type="number"
                      placeholder="8500"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("category")}</label>
                    <div className="relative">
                      <select
                        value={newCost.category}
                        onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722] appearance-none cursor-pointer"
                      >
                        <option value="" disabled>{t("select_category")}</option>
                        {categories.filter(c => c.type === 'expense').map(cat => (
                          <option key={cat._id} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f715d] pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("payment_method")}</label>
                    <div className="relative">
                      <select
                        value={newCost.paymentMethod}
                        onChange={(e) => setNewCost({ ...newCost, paymentMethod: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722] appearance-none cursor-pointer"
                      >
                        <option value="" disabled>{t("ui_select_method")}</option>
                        {methods.map(method => (
                          <option key={method._id} value={method.name}>{method.icon} {method.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f715d] pointer-events-none" />
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
                    className="py-4 rounded-xl bg-[#f5eedf]/70 text-xs font-black text-[#7f715d] uppercase tracking-widest hover:bg-[#fffdf5] transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSaveFixedCost}
                    className="py-4 rounded-xl bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
                  >
                    {editingCost ? t("ui_update_bill") : t("ui_save_bill")}
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

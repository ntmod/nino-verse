
"use client";
import { useLanguage } from "@/lib/language-context";

import LoadingScreen from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, X, ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { EmojiPicker } from "frimousse";
import { useModal } from "@/lib/modal-context";

export default function MethodSettings() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { openGlobalModal } = useModal();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [newMethod, setNewMethod] = useState({ name: "", icon: "💳", color: "#6366f1", desc: "", initialBalance: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerColumns, setPickerColumns] = useState(6);

  useEffect(() => {
    const updateColumns = () => {
      setPickerColumns(window.innerWidth >= 640 ? 8 : 6);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/nori/method");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMethods(data);
      }
    } catch (err) {
      console.error("Failed to fetch methods:", err);
    }
  };

  const handleSaveMethod = async () => {
    if (!newMethod.name || saving) return;
    setSaveError("");
    const balance = newMethod.initialBalance.trim() === "" ? null : Number(newMethod.initialBalance);
    if (balance !== null && (!Number.isFinite(balance) || !Number.isSafeInteger(Math.round(balance * 100)))) {
      setSaveError(language === "th" ? "กรุณาใส่ยอดเงินที่ถูกต้อง" : "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const url = editingMethod
        ? `/api/nori/method/${editingMethod._id}`
        : "/api/nori/method";
      const fetchMethod = editingMethod ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: fetchMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMethod, initialBalance: balance }),
      });
      if (!res.ok) throw new Error("Failed to save method");
      if (res.ok) {
        setIsModalOpen(false);
        setEditingMethod(null);
        setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "", initialBalance: "" });
        fetchMethods();

        openGlobalModal({
          header: t("ui_save_completed"),
          message: t("ui_the_payment_method_has_been_saved_successfully"),
          type: "success",
          mainButton: {
            label: t("close"),
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to save method:", err);
      setSaveError(language === "th" ? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้งนะ" : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = (id: string) => {
    openGlobalModal({
      header: t("ui_delete_method"),
      message: t("ui_are_you_sure_you_want_to_delete_this_payment_method_this_action_cannot_be_undone"),
      type: "danger",
      mainButton: {
        label: t("ui_yes_delete"),
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/method/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchMethods();
              setTimeout(() => {
                openGlobalModal({
                  header: t("ui_delete_completed"),
                  message: t("ui_the_payment_method_has_been_removed_successfully"),
                  type: "success",
                  mainButton: {
                    label: t("close"),
                    onClick: () => {}
                  }
                });
              }, 300);
            }
          } catch (err) {
            console.error("Failed to delete method:", err);
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

  const handleMove = async (method: any, direction: "up" | "down") => {
    const index = methods.findIndex(m => m._id === method._id);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === methods.length - 1) return;

    const newMethods = [...methods];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newMethods[index], newMethods[targetIndex]] = [newMethods[targetIndex], newMethods[index]];

    setMethods(newMethods);

    try {
      await fetch("/api/nori/method", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: newMethods.map((m, i) => ({ id: m._id, order: i }))
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
              className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] hover:bg-[#f5eedf]/70 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#7f715d]" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#292722] italic tracking-tighter uppercase">{t("settings_methods")}</h1>
              <p className="text-xs font-bold text-[#7f715d] uppercase tracking-widest">{t("ui_manage_your_cards_and_cash_wallets")}</p>
            </div>
          </div>
          <button
            onClick={() => { setSaveError(""); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("ui_add_method")}
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {methods.map((method, index) => (
              <motion.div
                key={method._id || index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 md:p-4 sm:p-6 rounded-none bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] flex flex-wrap gap-3 items-center justify-between group select-none"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex flex-col gap-0.5 -ml-1">
                    <button aria-label={t("move_up")}
                      onClick={() => handleMove(method, "up")}
                      className="p-1 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button aria-label={t("move_down")}
                      onClick={() => handleMove(method, "down")}
                      className="p-1 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
                    <div
                      className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${method.color}10` }}
                    >
                      {method.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black text-[#292722] italic uppercase">{method.name}</h3>
                      <p className="text-[10px] font-bold text-[#7f715d] uppercase tracking-widest mt-0.5">{method.desc}</p>
                      {method.balance != null && <p className="mt-2 text-xs font-bold text-[#416b54]">{language === 'th' ? 'คงเหลือ' : 'Balance'} · {method.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button aria-label={t("edit")}
                    onClick={() => {
                      setSaveError("");
                      setEditingMethod(method);
                      setNewMethod({ name: method.name, icon: method.icon, color: method.color, desc: method.desc || "", initialBalance: method.initialBalance == null ? "" : String(method.initialBalance) });
                      setIsModalOpen(true);
                    }}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] hover:bg-[#f5eedf]/70 transition-all group/btn cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-[#7f715d] group-hover/btn:text-[#b97423]" />
                  </button>
                  <button aria-label={t("delete")}
                    onClick={() => handleDeleteMethod(method._id)}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] hover:bg-rose-50 transition-all group/btn cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#7f715d] group-hover/btn:text-rose-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NEW/EDIT METHOD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingMethod(null);
                setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "", initialBalance: "" });
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
                    {editingMethod ? t("ui_edit_method") : t("ui_add_method")}
                  </h2>
                  <button aria-label={t("close")} onClick={() => {
                    setIsModalOpen(false);
                    setEditingMethod(null);
                    setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "", initialBalance: "" });
                  }} className="w-11 h-11 shrink-0 rounded-none bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-[#7f715d]" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ICON PICKER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest">{t("ui_select_icon")}</label>
                      <div className="rounded-none ring-2 ring-[#d9cebb] w-14 h-14 flex items-center justify-center text-[2rem] bg-[#fffdf5]">{newMethod.icon}</div>
                    </div>

                    <EmojiPicker.Root
                      locale={language}
                      columns={pickerColumns}
                      onEmojiSelect={(emoji) => setNewMethod({ ...newMethod, icon: emoji.emoji })}
                      className="flex flex-col gap-4"
                    >
                      <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f715d]" />
                        <EmojiPicker.Search
                          placeholder={t("ui_search_emojis")}
                          className="w-full pl-11 pr-6 py-3 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-xs font-bold text-[#292722]"
                        />
                      </div>

                      <EmojiPicker.Viewport className="w-full h-48 pr-2 custom-scrollbar bg-[#fffdf5]/50 rounded-xl p-2">
                        <EmojiPicker.List
                          components={{
                            CategoryHeader: ({ category, ...props }) => (
                              <div {...props} className="text-[9px] font-black text-[#7f715d] uppercase py-4 px-2 bg-[#fffdf5]/80 backdrop-blur-sm sticky top-0 z-10 -mx-2">
                                {category.label}
                              </div>
                            ),
                            Emoji: ({ emoji, ...props }) => (
                              <button
                                {...props}
                                className={`my-2 w-8 h-8 sm:w-10 sm:h-10 aspect-square rounded-none flex items-center justify-center text-2xl transition-all hover:bg-[#fffdf5] ${newMethod.icon === emoji.emoji ? "bg-[#fffdf5] ring-2 ring-[#b97423]/20 scale-110" : "hover:scale-120"}`}
                              >
                                {emoji.emoji}
                              </button>
                            ),
                            Row: ({ children, ...props }) => (
                              <div {...props} style={{ gridTemplateColumns: `repeat(${pickerColumns}, minmax(0, 1fr))` }} className="grid gap-2 justify-items-center">
                                {children}
                              </div>
                            )
                          }}
                        />
                      </EmojiPicker.Viewport>
                    </EmojiPicker.Root>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_method_name")}</label>
                    <input
                      type="text"
                      placeholder={t("ui_e_g_k_bank_credit")}
                      value={newMethod.name}
                      onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_description")}</label>
                    <input
                      type="text"
                      placeholder="•••• 4589"
                      value={newMethod.desc}
                      onChange={(e) => setNewMethod({ ...newMethod, desc: e.target.value })}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="method-initial-balance" className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{language === 'th' ? 'ยอดตั้งต้น (THB)' : 'Initial balance (THB)'}</label>
                    <input id="method-initial-balance" type="number" step="0.01" value={newMethod.initialBalance}
                      onChange={event => setNewMethod({ ...newMethod, initialBalance: event.target.value })}
                      placeholder={language === 'th' ? 'เว้นว่างหากไม่ติดตามยอดเงิน' : 'Leave blank to skip balance tracking'}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 text-sm font-bold text-[#292722]" />
                    <p className="text-[11px] leading-relaxed text-[#93846b]">{language === 'th' ? 'ยอดคงเหลือ = ยอดตั้งต้น + รายรับ − รายจ่ายทั้งหมด รวมรายการที่เคยบันทึกไว้แล้ว' : 'Balance = initial balance + all income − all expenses, including existing records.'}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_color_theme")}</label>
                    <input
                      type="color"
                      value={newMethod.color}
                      onChange={(e) => setNewMethod({ ...newMethod, color: e.target.value })}
                      className="w-full h-[54px] p-2 rounded-xl bg-[#f5eedf]/70 cursor-pointer"
                    />
                  </div>
                </div>

                {saveError && <p role="alert" className="mt-4 text-xs text-rose-600">{saveError}</p>}
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingMethod(null);
                      setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "", initialBalance: "" });
                    }}
                    className="py-4 rounded-xl bg-[#f5eedf]/70 text-xs font-black text-[#7f715d] uppercase tracking-widest hover:bg-[#f5eedf]/70 transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleSaveMethod}
                    className="py-4 rounded-xl bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
                  >
                    {saving ? (language === "th" ? "กำลังบันทึก…" : "Saving…") : editingMethod ? t("ui_update_method") : t("ui_save_method")}
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

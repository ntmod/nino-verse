
"use client";
import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, X, ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { EmojiPicker } from "frimousse";
import { useModal } from "@/lib/modal-context";

export default function MethodSettings() {
  const router = useRouter();
  const { openGlobalModal } = useModal();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [newMethod, setNewMethod] = useState({ name: "", icon: "💳", color: "#6366f1", desc: "" });
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
    if (!newMethod.name) return;
    try {
      const url = editingMethod 
        ? `/api/nori/method/${editingMethod._id}` 
        : "/api/nori/method";
      const fetchMethod = editingMethod ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: fetchMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMethod),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingMethod(null);
        setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "" });
        fetchMethods();
        
        openGlobalModal({
          header: "Save Completed",
          message: "The payment method has been saved successfully.",
          type: "success",
          mainButton: {
            label: "Close",
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to save method:", err);
    }
  };
 
  const handleDeleteMethod = (id: string) => {
    openGlobalModal({
      header: "Delete Method?",
      message: "Are you sure you want to delete this payment method? This action cannot be undone.",
      type: "danger",
      mainButton: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/method/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchMethods();
              setTimeout(() => {
                openGlobalModal({
                  header: "Delete Completed",
                  message: "The payment method has been removed successfully.",
                  type: "success",
                  mainButton: {
                    label: "Close",
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
        label: "Cancel",
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
              <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Payment Methods</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your cards and cash wallets</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Method
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
                className="p-4 md:p-6 rounded-3xl bg-white border border-black/5 flex items-center justify-between group select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5 -ml-1">
                    <button 
                      onClick={() => handleMove(method, "up")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMove(method, "down")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 text-2xl"
                      style={{ backgroundColor: `${method.color}10` }}
                    >
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 italic uppercase">{method.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{method.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingMethod(method);
                      setNewMethod({ name: method.name, icon: method.icon, color: method.color, desc: method.desc });
                      setIsModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-white hover:shadow-md transition-all group/btn cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-slate-400 group-hover/btn:text-[#FF9D00]" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMethod(method._id)}
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

      {/* NEW/EDIT METHOD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingMethod(null);
                setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "" });
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
                    {editingMethod ? "Edit Method" : "Add Method"}
                  </h2>
                  <button onClick={() => {
                    setIsModalOpen(false);
                    setEditingMethod(null);
                    setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "" });
                  }} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ICON PICKER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Icon</label>
                      <div className="rounded-3xl ring-2 ring-slate-100 w-14 h-14 flex items-center justify-center text-[2rem] bg-slate-50">{newMethod.icon}</div>
                    </div>

                    <EmojiPicker.Root
                      columns={pickerColumns}
                      onEmojiSelect={(emoji) => setNewMethod({ ...newMethod, icon: emoji.emoji })}
                      className="flex flex-col gap-4"
                    >
                      <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <EmojiPicker.Search
                          placeholder="Search emojis..."
                          className="w-full pl-11 pr-6 py-3 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-xs font-bold text-slate-900"
                        />
                      </div>

                      <EmojiPicker.Viewport className="w-full h-48 pr-2 custom-scrollbar bg-slate-50/50 rounded-xl border border-black/5 p-2">
                        <EmojiPicker.List
                          components={{
                            CategoryHeader: ({ category, ...props }) => (
                              <div {...props} className="text-[9px] font-black text-slate-400 uppercase py-4 px-2 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 -mx-2">
                                {category.label}
                              </div>
                            ),
                            Emoji: ({ emoji, ...props }) => (
                              <button
                                {...props}
                                className={`my-2 w-10 h-10 aspect-square rounded-full flex items-center justify-center text-2xl transition-all hover:bg-white ${newMethod.icon === emoji.emoji ? "bg-white ring-2 ring-[#FF9D00]/20 scale-110" : "hover:scale-120"}`}
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Method Name</label>
                    <input
                      type="text"
                      placeholder="e.g. K-Bank Credit"
                      value={newMethod.name}
                      onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. **** 4589"
                      value={newMethod.desc}
                      onChange={(e) => setNewMethod({ ...newMethod, desc: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Theme</label>
                    <input
                      type="color"
                      value={newMethod.color}
                      onChange={(e) => setNewMethod({ ...newMethod, color: e.target.value })}
                      className="w-full h-[54px] p-2 rounded-2xl bg-slate-50 border border-black/5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingMethod(null);
                      setNewMethod({ name: "", icon: "💳", color: "#6366f1", desc: "" });
                    }}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMethod}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    {editingMethod ? "Update Method" : "Save Method"}
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


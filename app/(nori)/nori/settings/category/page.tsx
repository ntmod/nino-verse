"use client";

import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Tags, Plus, Pencil, Trash2, ArrowLeft, X, Search as SearchIcon, ChevronDown, ChevronUp
} from "lucide-react";
import { EmojiPicker } from "frimousse";
import { useModal } from "@/lib/modal-context";

function CategoryCard({ 
  cat, 
  isExpanded, 
  setExpandedId, 
  setSelectedCategoryForSub, 
  setEditingCategory, 
  setNewCat, 
  setIsModalOpen, 
  handleDeleteCategory,
  setSelectedSubForEdit,
  setEditSubName,
  handleDeleteSubcategory,
  handleMove
}: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl bg-white border border-black/5 overflow-hidden group select-none"
    >
      <div 
        onClick={() => setExpandedId(isExpanded ? null : cat._id)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5 -ml-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleMove(cat, "up");
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleMove(cat, "down");
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-black/5 ${
                cat.type === "income" ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              {cat.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900 italic uppercase tracking-tight">{cat.name}</h3>
              </div>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {cat.subcategories.length} subs
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategoryForSub(cat);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 transition-all group/subbtn"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover/subbtn:text-white" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(cat);
                setNewCat({ name: cat.name, icon: cat.icon, type: cat.type });
                setIsModalOpen(true);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-white hover:shadow-md transition-all group/btn"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#FF9D00]" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(cat._id);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all group/btn"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-rose-500" />
            </button>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="w-6 h-6 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="border-t border-black/5"
          >
            <div className="p-4 pt-1.5 bg-slate-50/30">
              <div className="flex flex-col gap-1.5 pl-[56px]">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub: any, subIndex: number) => (
                    <div 
                      key={sub._id || subIndex}
                      className="group/sub flex items-center justify-between p-3 rounded-2xl bg-white border border-black/5 transition-all hover:shadow-sm"
                    >
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{sub.name}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubForEdit({ catId: cat._id, subId: sub._id, name: sub.name });
                            setEditSubName(sub.name);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#FF9D00] transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubcategory(cat._id, sub._id);
                          }}
                          className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic py-4">No subcategories yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CategorySettings() {
  const router = useRouter();
  const { openGlobalModal } = useModal();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState<{name: string, icon: string, type: "expense" | "income"}>({ name: "", icon: "🍴", type: "expense" });
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [pickerColumns, setPickerColumns] = useState(6);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<any>(null);
  const [newSubName, setNewSubName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<{catId: string, subId: string, name: string} | null>(null);
  const [editSubName, setEditSubName] = useState("");

  useEffect(() => {
    const updateColumns = () => {
      setPickerColumns(window.innerWidth >= 640 ? 8 : 6);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Mock data for initial categories
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/nori/category");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCat.name) return;
    try {
      const url = editingCategory 
        ? `/api/nori/category/${editingCategory._id}` 
        : "/api/nori/category";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCat({ name: "", icon: "🍴", type: "expense" });
        setEditingCategory(null);
        fetchCategories();
        
        openGlobalModal({
          header: "Save Completed",
          message: "The category has been saved successfully.",
          type: "success",
          mainButton: {
            label: "Close",
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  const handleDeleteCategory = (id: string) => {
    openGlobalModal({
      header: "Delete Category?",
      message: "Are you sure you want to delete this category? All subcategories will be lost. This action cannot be undone.",
      type: "danger",
      mainButton: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/category/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchCategories();
              setTimeout(() => {
                openGlobalModal({
                  header: "Delete Completed",
                  message: "The category has been deleted successfully.",
                  type: "success",
                  mainButton: {
                    label: "Close",
                    onClick: () => {}
                  }
                });
              }, 300);
            }
          } catch (err) {
            console.error("Failed to delete category:", err);
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

  const handleSaveSubcategory = async () => {
    if (!newSubName || !selectedCategoryForSub) return;
    try {
      const res = await fetch(`/api/nori/category/${selectedCategoryForSub._id}/subcategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubName }),
      });
      if (res.ok) {
        setSelectedCategoryForSub(null);
        setNewSubName("");
        fetchCategories();
        
        openGlobalModal({
          header: "Save Completed",
          message: "The subcategory has been created successfully.",
          type: "success",
          mainButton: {
            label: "Close",
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to save subcategory:", err);
    }
  };

  const handleDeleteSubcategory = (catId: string, subId: string) => {
    openGlobalModal({
      header: "Delete Subcategory?",
      message: "Are you sure you want to remove this label?",
      type: "danger",
      mainButton: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/category/${catId}/subcategory?subId=${subId}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchCategories();
              setTimeout(() => {
                openGlobalModal({
                  header: "Delete Completed",
                  message: "The subcategory has been deleted successfully.",
                  type: "success",
                  mainButton: {
                    label: "Close",
                    onClick: () => {}
                  }
                });
              }, 300);
            }
          } catch (err) {
            console.error("Failed to delete subcategory:", err);
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

  const handleUpdateSubcategory = async () => {
    if (!editSubName || !selectedSubForEdit) return;
    try {
      const res = await fetch(`/api/nori/category/${selectedSubForEdit.catId}/subcategory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subId: selectedSubForEdit.subId, name: editSubName }),
      });
      if (res.ok) {
        setSelectedSubForEdit(null);
        setEditSubName("");
        fetchCategories();
        
        openGlobalModal({
          header: "Save Completed",
          message: "The subcategory has been updated successfully.",
          type: "success",
          mainButton: {
            label: "Close",
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error("Failed to update subcategory:", err);
    }
  };

  const handleReorder = async (newOrder: any[], type: "income" | "expense") => {
    // Update local state first
    setCategories(prev => {
      const otherTypeItems = prev.filter(c => c.type !== type);
      // We want to keep the overall list but update the specific type's order
      return [...otherTypeItems, ...newOrder];
    });

    // Save to database
    try {
      const orders = newOrder.map((cat, index) => ({
        id: cat._id,
        order: index
      }));
      
      await fetch("/api/nori/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });
    } catch (err) {
      console.error("Failed to save new order:", err);
    }
  };

  const handleMove = async (cat: any, direction: "up" | "down") => {
    const type = cat.type;
    const sameTypeCats = categories.filter(c => c.type === type);
    const index = sameTypeCats.findIndex(c => c._id === cat._id);
    
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sameTypeCats.length - 1) return;

    const newSameTypeCats = [...sameTypeCats];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    [newSameTypeCats[index], newSameTypeCats[targetIndex]] = [newSameTypeCats[targetIndex], newSameTypeCats[index]];

    // Update state and database
    handleReorder(newSameTypeCats, type);
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

      <div className="max-w-5xl w-full space-y-10">
        <header className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Category Manager</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Create and edit spending labels</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Category
            </button>
          </div>

          <div className="flex p-1 rounded-xl bg-slate-100 border border-black/5 w-fit">
            {["all", "expense", "income"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  filterType === type 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* INCOME COLUMN */}
          {(filterType === "all" || filterType === "income") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Income</h2>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {categories.filter(c => c.type === "income").length} Items
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {categories
                  .filter(cat => cat.type === "income")
                  .map((cat) => (
                    <CategoryCard 
                      key={cat._id || cat.id}
                      cat={cat} 
                      isExpanded={expandedId === cat._id}
                      setExpandedId={setExpandedId}
                      setSelectedCategoryForSub={setSelectedCategoryForSub}
                      setEditingCategory={setEditingCategory}
                      setNewCat={setNewCat}
                      setIsModalOpen={setIsModalOpen}
                      handleDeleteCategory={handleDeleteCategory}
                      setSelectedSubForEdit={setSelectedSubForEdit}
                      setEditSubName={setEditSubName}
                      handleDeleteSubcategory={handleDeleteSubcategory}
                      handleMove={handleMove}
                    />
                  ))}
              </div>
              {categories.filter(c => c.type === "income").length === 0 && (
                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No income categories</p>
                </div>
              )}
            </div>
          )}

          {/* EXPENSE COLUMN */}
          {(filterType === "all" || filterType === "expense") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Expense</h2>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {categories.filter(c => c.type === "expense").length} Items
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {categories
                  .filter(cat => cat.type === "expense")
                  .map((cat) => (
                    <CategoryCard 
                      key={cat._id || cat.id}
                      cat={cat} 
                      isExpanded={expandedId === cat._id}
                      setExpandedId={setExpandedId}
                      setSelectedCategoryForSub={setSelectedCategoryForSub}
                      setEditingCategory={setEditingCategory}
                      setNewCat={setNewCat}
                      setIsModalOpen={setIsModalOpen}
                      handleDeleteCategory={handleDeleteCategory}
                      setSelectedSubForEdit={setSelectedSubForEdit}
                      setEditSubName={setEditSubName}
                      handleDeleteSubcategory={handleDeleteSubcategory}
                      handleMove={handleMove}
                    />
                  ))}
              </div>
              {categories.filter(c => c.type === "expense").length === 0 && (
                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No expense categories</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NEW CATEGORY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg md:max-w-xl bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
            >
              <div className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
                    {editingCategory ? "Edit Category" : "Create Category"}
                  </h2>
                  <button onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setNewCat({ name: "", icon: "🍴", type: "expense" });
                  }} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ICON PICKER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Icon</label>
                      <div className="rounded-3xl ring-2 ring-slate-100 w-14 h-14 flex items-center justify-center text-[2rem] bg-slate-50">{newCat.icon}</div>
                    </div>

                    <EmojiPicker.Root
                      columns={pickerColumns}
                      onEmojiSelect={(emoji) => setNewCat({ ...newCat, icon: emoji.emoji })}
                      className="flex flex-col gap-4"
                    >
                      <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <EmojiPicker.Search
                          placeholder="Search emojis..."
                          className="w-full pl-11 pr-6 py-3 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-xs font-bold text-slate-900"
                        />
                      </div>

                      <EmojiPicker.Viewport className="w-full h-48  pr-2 custom-scrollbar bg-slate-50/50 rounded-xl border border-black/5 p-2">
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
                                className={`my-2 w-10 h-10 aspect-square rounded-full flex items-center justify-center text-2xl transition-all hover:bg-white ${newCat.icon === emoji.emoji ? "bg-white ring-2 ring-[#FF9D00]/20 scale-110" : "hover:scale-120"
                                  }`}
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
                        <EmojiPicker.Loading>
                          <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Loading Emojis...
                          </div>
                        </EmojiPicker.Loading>
                        <EmojiPicker.Empty>
                          {({ search }) => (
                            <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              No emoji found for "{search}"
                            </div>
                          )}
                        </EmojiPicker.Empty>
                      </EmojiPicker.Viewport>
                    </EmojiPicker.Root>
                  </div>

                  {/* TYPE SELECTOR */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["expense", "income"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewCat({ ...newCat, type: type as any })}
                          className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            newCat.type === type
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-black/10"
                              : "bg-slate-50 text-slate-400 border-black/5 hover:bg-slate-100"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NAME INPUT */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Groceries"
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingCategory(null);
                      setNewCat({ name: "", icon: "🍴", type: "expense" });
                    }}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    {editingCategory ? "Update Category" : "Save Category"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* NEW SUBCATEGORY MODAL */}
      <AnimatePresence>
        {selectedCategoryForSub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategoryForSub(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Add Subcategory</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Under {selectedCategoryForSub.name}</p>
                  </div>
                  <button onClick={() => setSelectedCategoryForSub(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory Name</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. Breakfast, Lunch, Dinner"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveSubcategory()}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setSelectedCategoryForSub(null)}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubcategory}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    Save Sub
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* EDIT SUBCATEGORY MODAL */}
      <AnimatePresence>
        {selectedSubForEdit && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubForEdit(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Edit Subcategory</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Updating label</p>
                  </div>
                  <button onClick={() => setSelectedSubForEdit(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={editSubName}
                      onChange={(e) => setEditSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubcategory()}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setSelectedSubForEdit(null)}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSubcategory}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    Update
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


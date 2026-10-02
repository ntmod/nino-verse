"use client";

import { useLanguage } from "@/lib/language-context";

import LoadingScreen from "@/components/LoadingScreen";
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
  const { t } = useLanguage();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-none bg-[#fffdf5] overflow-hidden group select-none"
    >
      <div
        onClick={() => setExpandedId(isExpanded ? null : cat._id)}
        className="p-3.5 flex flex-wrap gap-3 items-center justify-between cursor-pointer hover:bg-[#fffdf5] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5 -ml-1">
            <button aria-label={t("move_up")}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(cat, "up");
              }}
              className="p-0.5 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button aria-label={t("move_down")}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(cat, "down");
              }}
              className="p-0.5 rounded hover:bg-[#fffdf5] text-[#b6a68e] hover:text-[#403b32] transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${
                cat.type === "income" ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              {cat.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="break-words text-xs font-black text-[#292722] italic uppercase tracking-tight">{cat.name}</h3>
              </div>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <p className="text-[8px] font-bold text-[#7f715d] uppercase tracking-widest mt-0.5">
                  {cat.subcategories.length} {t("ui_subs")}
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
              className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#f5eedf]/70 transition-all group/subbtn"
            >
              <Plus className="w-3.5 h-3.5 text-[#7f715d] group-hover/subbtn:text-[#b97423]" />
            </button>
            <button aria-label={t("edit")}
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(cat);
                setNewCat({ name: cat.name, icon: cat.icon, type: cat.type });
                setIsModalOpen(true);
              }}
              className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#f5eedf]/70 transition-all group/btn"
            >
              <Pencil className="w-3.5 h-3.5 text-[#7f715d] group-hover/btn:text-[#b97423]" />
            </button>
            <button aria-label={t("delete")}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(cat._id);
              }}
              className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-rose-50 transition-all group/btn"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#7f715d] group-hover/btn:text-rose-500" />
            </button>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="w-6 h-6 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-[#b6a68e]" />
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
            <div className="p-4 pt-1.5 bg-[#fffdf5]/30">
              <div className="flex flex-col gap-1.5 pl-0 sm:pl-[56px]">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub: any, subIndex: number) => (
                    <div
                      key={sub._id || subIndex}
                      className="group/sub flex items-center justify-between p-3 rounded-none bg-[#fffdf5] transition-all hover:shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)]"
                    >
                      <span className="text-[11px] font-black text-[#403b32] uppercase tracking-tight">{sub.name}</span>
                      <div className="flex items-center gap-1">
                        <button aria-label={t("edit")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubForEdit({ catId: cat._id, subId: sub._id, name: sub.name });
                            setEditSubName(sub.name);
                          }}
                          className="p-2 rounded-none hover:bg-[#fffdf5] text-[#7f715d] hover:text-[#b97423] transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button aria-label={t("delete")}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubcategory(cat._id, sub._id);
                          }}
                          className="p-2 rounded-none hover:bg-rose-50 text-[#7f715d] hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-bold text-[#b6a68e] uppercase tracking-widest italic py-4">{t("ui_no_subcategories_yet")}</p>
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
  const { t, language } = useLanguage();
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
          header: t("ui_save_completed"),
          message: t("ui_the_category_has_been_saved_successfully"),
          type: "success",
          mainButton: {
            label: t("close"),
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
      header: t("ui_delete_category"),
      message: t("ui_are_you_sure_you_want_to_delete_this_category_all_subcategories_will_be_lost_this_action_cannot_be_undone"),
      type: "danger",
      mainButton: {
        label: t("ui_yes_delete"),
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/category/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchCategories();
              setTimeout(() => {
                openGlobalModal({
                  header: t("ui_delete_completed"),
                  message: t("ui_the_category_has_been_deleted_successfully"),
                  type: "success",
                  mainButton: {
                    label: t("close"),
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
        label: t("cancel"),
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
          header: t("ui_save_completed"),
          message: t("ui_the_subcategory_has_been_created_successfully"),
          type: "success",
          mainButton: {
            label: t("close"),
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
      header: t("ui_delete_subcategory"),
      message: t("ui_are_you_sure_you_want_to_remove_this_label"),
      type: "danger",
      mainButton: {
        label: t("ui_yes_delete"),
        onClick: async () => {
          try {
            const res = await fetch(`/api/nori/category/${catId}/subcategory?subId=${subId}`, {
              method: "DELETE",
            });
            if (res.ok) {
              fetchCategories();
              setTimeout(() => {
                openGlobalModal({
                  header: t("ui_delete_completed"),
                  message: t("ui_the_subcategory_has_been_deleted_successfully"),
                  type: "success",
                  mainButton: {
                    label: t("close"),
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
        label: t("cancel"),
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
          header: t("ui_save_completed"),
          message: t("ui_the_subcategory_has_been_updated_successfully"),
          type: "success",
          mainButton: {
            label: t("close"),
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
      router.push("/settings");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#f5f0e5] flex flex-col items-center px-4 sm:px-6 py-8 pt-24 pb-28">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-5xl w-full space-y-10">
        <header className="flex flex-col gap-6 mb-8">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <button aria-label={t("back")}
                onClick={handleBack}
                className="w-11 h-11 shrink-0 rounded-xl bg-[#fffdf5] flex items-center justify-center hover:bg-[#f5eedf]/70 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#7f715d]" />
              </button>
              <div>
                <h1 className="text-xl font-black text-[#292722] italic tracking-tighter uppercase">{t("ui_category_manager")}</h1>
                <p className="text-[9px] font-bold text-[#7f715d] uppercase tracking-widest">{t("ui_create_and_edit_spending_labels")}</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-none bg-[#e9a342] text-[#372b1c] text-[10px] font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("ui_new_category")}
            </button>
          </div>

          <div className="flex p-1 rounded-none bg-[#fffdf5] w-fit">
            {["all", "expense", "income"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-5 py-2 rounded-none text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  filterType === type
                    ? "bg-[#fffdf5] text-[#292722] shadow-none"
                    : "text-[#7f715d] hover:text-[#403b32]"
                }`}
              >
                {t(type === "all" ? "all" : type === "income" ? "ui_income" : "ui_expense")}
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
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-none" />
                  <div>
                    <h2 className="text-xs font-black text-[#292722] uppercase italic tracking-tight">{t("ui_income")}</h2>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#7f715d] uppercase tracking-widest">
                  {categories.filter(c => c.type === "income").length} {t("ui_items")}
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
                <div className="p-8 rounded-none border-2 border-dashed border-[#d9cebb] flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black text-[#b6a68e] uppercase tracking-widest italic">{t("ui_no_income_categories")}</p>
                </div>
              )}
            </div>
          )}

          {/* EXPENSE COLUMN */}
          {(filterType === "all" || filterType === "expense") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-none" />
                  <div>
                    <h2 className="text-xs font-black text-[#292722] uppercase italic tracking-tight">{t("ui_expense")}</h2>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#7f715d] uppercase tracking-widest">
                  {categories.filter(c => c.type === "expense").length} {t("ui_items")}
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
                <div className="p-8 rounded-none border-2 border-dashed border-[#d9cebb] flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black text-[#b6a68e] uppercase tracking-widest italic">{t("ui_no_expense_categories")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NEW CATEGORY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#292722]/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-h-[85dvh] relative w-full max-w-lg md:max-w-xl bg-[#fffdf5] rounded-none shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] overflow-y-auto"
            >
              <div className="p-4 md:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-[#292722] italic uppercase tracking-tighter">
                    {editingCategory ? t("ui_edit_category") : t("ui_create_category")}
                  </h2>
                  <button aria-label={t("close")} onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setNewCat({ name: "", icon: "🍴", type: "expense" });
                  }} className="w-11 h-11 shrink-0 rounded-none bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-[#7f715d]" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ICON PICKER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest">{t("ui_select_icon")}</label>
                      <div className="rounded-none ring-2 ring-[#d9cebb] w-14 h-14 flex items-center justify-center text-[2rem] bg-[#fffdf5]">{newCat.icon}</div>
                    </div>

                    <EmojiPicker.Root
                      locale={language}
                      columns={pickerColumns}
                      onEmojiSelect={(emoji) => setNewCat({ ...newCat, icon: emoji.emoji })}
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
                                className={`my-2 w-8 h-8 sm:w-10 sm:h-10 aspect-square rounded-none flex items-center justify-center text-2xl transition-all hover:bg-[#fffdf5] ${newCat.icon === emoji.emoji ? "bg-[#fffdf5] ring-2 ring-[#b97423]/20 scale-110" : "hover:scale-120"
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
                          <div className="h-full flex items-center justify-center text-[10px] font-black text-[#7f715d] uppercase tracking-widest">
                            {t("ui_loading_emojis")}
                          </div>
                        </EmojiPicker.Loading>
                        <EmojiPicker.Empty>
                          {({ search }) => (
                            <div className="h-full flex items-center justify-center text-[10px] font-black text-[#7f715d] uppercase tracking-widest">
                              {t("emoji_not_found")} “{search}”
                            </div>
                          )}
                        </EmojiPicker.Empty>
                      </EmojiPicker.Viewport>
                    </EmojiPicker.Root>
                  </div>

                  {/* TYPE SELECTOR */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_type")}</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["expense", "income"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewCat({ ...newCat, type: type as any })}
                          className={`py-4 rounded-none border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                            newCat.type === type
                              ? "bg-[#e9a342] text-[#372b1c] border-[#b97423] shadow-none shadow-black/10"
                              : "bg-[#fffdf5] text-[#7f715d] border-black/5 hover:bg-[#fffdf5]"
                          }`}
                        >
                          {t(type === "all" ? "all" : type === "income" ? "ui_income" : "ui_expense")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NAME INPUT */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_category_name")}</label>
                    <input
                      type="text"
                      placeholder={t("ui_e_g_groceries")}
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
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
                    className="py-4 rounded-xl bg-[#f5eedf]/70 text-xs font-black text-[#7f715d] uppercase tracking-widest hover:bg-[#f5eedf]/70 transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    className="py-4 rounded-none bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
                  >
                    {editingCategory ? t("ui_update_category") : t("ui_save_category")}
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
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategoryForSub(null)}
              className="absolute inset-0 bg-[#292722]/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-h-[85dvh] relative w-full max-w-md bg-[#fffdf5] rounded-none shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-[#292722] italic uppercase tracking-tighter">{t("ui_add_subcategory")}</h2>
                    <p className="text-[10px] font-bold text-[#7f715d] uppercase tracking-widest mt-1">{t("ui_under")} {selectedCategoryForSub.name}</p>
                  </div>
                  <button aria-label={t("close")} onClick={() => setSelectedCategoryForSub(null)} className="w-11 h-11 shrink-0 rounded-none bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-[#7f715d]" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_subcategory_name")}</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder={t("ui_e_g_breakfast_lunch_dinner")}
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveSubcategory()}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setSelectedCategoryForSub(null)}
                    className="py-4 rounded-xl bg-[#f5eedf]/70 text-xs font-black text-[#7f715d] uppercase tracking-widest hover:bg-[#f5eedf]/70 transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSaveSubcategory}
                    className="py-4 rounded-none bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
                  >
                    {t("ui_save_sub")}
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
          <div className="fixed inset-0 z-[20010] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubForEdit(null)}
              className="absolute inset-0 bg-[#292722]/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-h-[85dvh] relative w-full max-w-md bg-[#fffdf5] rounded-none shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-[#292722] italic uppercase tracking-tighter">{t("ui_edit_subcategory")}</h2>
                    <p className="text-[10px] font-bold text-[#7f715d] uppercase tracking-widest mt-1">{t("ui_updating_label")}</p>
                  </div>
                  <button aria-label={t("close")} onClick={() => setSelectedSubForEdit(null)} className="w-11 h-11 shrink-0 rounded-none bg-[#fffdf5] flex items-center justify-center hover:bg-[#fffdf5] transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-[#7f715d]" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest ml-1">{t("ui_subcategory_name")}</label>
                    <input
                      autoFocus
                      type="text"
                      value={editSubName}
                      onChange={(e) => setEditSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubcategory()}
                      className="w-full px-6 py-4 rounded-xl bg-[#f5eedf]/70 focus:outline-none focus:ring-2 focus:ring-[#b97423]/20 focus:bg-[#fffdf5] transition-all text-sm font-bold text-[#292722]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setSelectedSubForEdit(null)}
                    className="py-4 rounded-xl bg-[#f5eedf]/70 text-xs font-black text-[#7f715d] uppercase tracking-widest hover:bg-[#f5eedf]/70 transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleUpdateSubcategory}
                    className="py-4 rounded-none bg-[#e9a342] text-[#372b1c] text-xs font-black uppercase tracking-widest hover:bg-[#403b32] transition-all shadow-none shadow-black/10 cursor-pointer"
                  >
                    {t("ui_update")}
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

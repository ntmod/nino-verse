'use client'

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Calendar, 
  CreditCard, 
  ChevronDown, 
  X,
  ArrowLeft,
  Pencil,
  Trash2
} from "lucide-react";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import FloatingActionButton from "@/components/v2/FloatingActionButton";
import { useModal } from "@/lib/modal-context";
import { Transaction } from "@/lib/types";
import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";

// --- Initial Data ---
const INITIAL_TRANSACTIONS: Transaction[] = [];

export default function NotePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); 
  
  const { openExpenseModal, openGlobalModal } = useModal();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txData, catData, payData] = await Promise.all([
          transactionService.getAll(),
          categoryService.getAll(),
          paymentService.getAll()
        ]);

        if (Array.isArray(txData)) {
          setTransactions(txData.map((tx: any) => ({
            ...tx,
            displayDate: new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          })));
        }
        
        if (Array.isArray(catData)) setCategories(catData);
        if (Array.isArray(payData)) setPaymentMethods(payData);
      } catch (error) {
        console.error("Failed to fetch page data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
      const selectedCatObj = categories.find(c => c._id === selectedCategory || c.name === selectedCategory);
      const matchesCategory = selectedCategory === "All" || 
        tx.category === selectedCategory || 
        (selectedCatObj && (tx.category === selectedCatObj._id || tx.category === selectedCatObj.name));
      const selectedPayObj = paymentMethods.find(p => p._id === selectedPayment || p.name === selectedPayment);
      const matchesPayment = selectedPayment === "All" || 
        tx.paymentMethod === selectedPayment ||
        (selectedPayObj && (tx.paymentMethod === selectedPayObj._id || tx.paymentMethod === selectedPayObj.name));
      
      const txDateStr = tx.date ? new Date(tx.date).toISOString().split('T')[0] : "";
      const matchesDate = !dateFilter || txDateStr === dateFilter;
      
      return matchesSearch && matchesCategory && matchesPayment && matchesDate;
    });
  }, [transactions, searchQuery, selectedCategory, selectedPayment, dateFilter, categories, paymentMethods]);

  const groupedTransactions = useMemo(() => {
    // Sort transactions descending by date first
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: Record<string, Transaction[]> = {};
    sorted.forEach(tx => {
      const dateObj = new Date(tx.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let groupKey = "";
      if (dateObj.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric',
          year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });

    return Object.entries(groups);
  }, [filteredTransactions]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPayment("All");
    setDateFilter("");
  };

  const handleAddSuccess = (newTx: Transaction) => {
    setTransactions([newTx, ...transactions]);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] flex flex-col items-center p-0 md:p-6 pt-16 md:pt-24 pb-20">
      <LoadingScreen mode="in" />

      <div className="w-full max-w-2xl px-4 md:px-0 space-y-6 md:space-y-8">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/v2/nori" className="flex items-center gap-1.5 text-gray-400 hover:text-[#1A1A1A] transition-colors mb-2 text-[10px] font-bold uppercase tracking-widest font-mono">
              <ArrowLeft className="w-3 h-3" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight uppercase font-mono">
              Notes<span className="text-gray-300">/</span><span className="text-[#FF9D00]">Expense</span>
            </h1>
          </motion.div>
          
          <div className="text-right font-mono">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredTransactions.length} Items</p>
          </div>
        </div>

        {/* Minimal Filters Card in Floating Style */}
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 rounded-2xl p-4 md:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-sm font-bold text-[#1A1A1A] focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {(() => {
                  const categoryData = categories.find(c => c._id === selectedCategory || c.name === selectedCategory);
                  const icon = categoryData?.icon || "🏷️";
                  return <span className="text-sm">{selectedCategory === "All" ? "🏷️" : icon}</span>;
                })()}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 appearance-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 appearance-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
              >
                <option value="All">All Payments</option>
                {paymentMethods.map(pm => <option key={pm._id} value={pm._id}>{pm.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative col-span-2 md:col-span-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all font-mono"
              />
            </div>
          </div>

          {(searchQuery || selectedCategory !== "All" || selectedPayment !== "All" || dateFilter) && (
            <button onClick={resetFilters} className="text-[10px] font-bold text-[#FF9D00] hover:text-[#E08B00] uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors font-mono">
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Floating Style Transaction List */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {groupedTransactions.length > 0 ? (
              groupedTransactions.map(([dateGroup, txList]) => (
                <div key={dateGroup} className="space-y-2">
                  {/* Sticky Date Header */}
                  <div className="sticky top-[56px] md:top-[72px] bg-[#f5f5f7]/95 backdrop-blur-md py-2.5 z-10 flex items-center justify-between border-b border-slate-200/60 font-mono">
                    <span className="text-[10px] font-black text-[#777777] uppercase tracking-[0.15em]">{dateGroup}</span>
                    <span className="text-[9px] font-bold text-[#777777] uppercase tracking-wider bg-white border border-slate-100 rounded-md px-2 py-0.5 shadow-sm">
                      {txList.length} {txList.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                  
                  {/* Inner list of items */}
                  <div className="divide-y divide-slate-100">
                    {txList.map((tx) => {
                      const categoryData = categories.find(c => c._id === tx.category || c.name === tx.category);
                      const categoryIcon = categoryData?.icon || "🏷️";
                      const subCategoryObj = categoryData?.subcategories?.find((s: any) => s._id === tx.subCategory);
                      const subCategoryName = subCategoryObj ? subCategoryObj.name : "";

                      return (
                        <motion.div
                          key={tx._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between py-4 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm group-hover:bg-slate-50 transition-all duration-300 shrink-0">
                              <span className="text-xl group-hover:scale-110 transition-transform">{categoryIcon}</span>
                            </div>
                            <div className="text-left">
                              <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight line-clamp-1 leading-none mb-1.5">{tx.name}</h3>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] font-bold text-[#FF9D00] uppercase tracking-widest flex items-center gap-1.5 flex-wrap font-mono leading-none">
                                  <span>{categoryData ? categoryData.name : tx.category}</span>
                                  {subCategoryName && (
                                    <>
                                      <span className="text-slate-300">/</span>
                                      <span className="text-slate-400 lowercase font-medium">{subCategoryName}</span>
                                    </>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                  <span>{(() => {
                                    const payData = paymentMethods.find(p => p._id === tx.paymentMethod || p.name === tx.paymentMethod);
                                    return payData ? payData.name : tx.paymentMethod;
                                  })()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-sm md:text-base font-black italic font-mono ${tx.amount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase font-mono">THB</p>
                            </div>
                            
                            <button 
                              onClick={() => openExpenseModal(undefined, tx)}
                              className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#FF9D00] hover:border-slate-300 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                openGlobalModal({
                                  header: "Delete Record?",
                                  message: `Are you sure you want to delete "${tx.name}"? This action cannot be undone.`,
                                  type: "delete",
                                  mainButton: {
                                    label: "Delete Now",
                                    color: "bg-rose-500 text-white hover:bg-rose-600",
                                    onClick: async () => {
                                      try {
                                        await transactionService.delete(tx._id);
                                        setTimeout(() => {
                                          openGlobalModal({
                                            header: "Delete Completed",
                                            message: `"${tx.name}" has been deleted successfully.`,
                                            type: "success",
                                            mainButton: {
                                              label: "Close",
                                              onClick: () => {
                                                window.location.reload();
                                              }
                                            }
                                          });
                                        }, 300);
                                      } catch (error) {
                                        console.error("Delete error:", error);
                                      }
                                    }
                                  },
                                  subButton: {
                                    label: "Go Back",
                                    onClick: () => {}
                                  }
                                });
                              }}
                              className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-slate-300 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">Empty Note</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onSuccess={handleAddSuccess} />
    </main>
  );
}

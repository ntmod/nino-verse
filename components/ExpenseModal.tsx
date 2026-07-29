'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ChevronDown, Plus } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { Transaction } from "@/lib/types";
import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
export default function ExpenseModal() {
  const { isExpenseModalOpen, closeExpenseModal, onSuccess, editingTransaction, openGlobalModal } = useModal();
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountError, setAmountError] = useState(false);

  useEffect(() => {
    if (!isExpenseModalOpen) return;

    if (editingTransaction) {
      setNewName(editingTransaction.name || "");
      // Format amount with commas and 2 decimals if defined
      if (editingTransaction.amount !== undefined && editingTransaction.amount !== null) {
        const absAmount = Math.abs(editingTransaction.amount);
        const parts = absAmount.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts[1]) parts[1] = parts[1].substring(0, 2);
        setNewAmount(parts.join('.'));
      } else {
        setNewAmount("");
      }
      
      setNewCategory(editingTransaction.category || "");
      setNewSubCategory(editingTransaction.subCategory || "");
      setNewPayment(editingTransaction.paymentMethod || "");
      setNewDate(editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAmountError(false);
    } else {
      // Reset Form to initial state on open
      setNewName("");
      setNewAmount("");
      setNewSubCategory("");
      setAmountError(false);
      setNewDate(new Date().toISOString().split('T')[0]);
    }

    const fetchData = async () => {
      try {
        const [catData, payData] = await Promise.all([
          categoryService.getAll(),
          paymentService.getAll()
        ]);
        
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
          if (editingTransaction && editingTransaction.category) {
            const searchName = editingTransaction.category.toLowerCase();
            const foundCat = catData.find(c => {
              const nameLower = c.name.toLowerCase();
              if (c._id === editingTransaction.category) return true;
              if (nameLower === searchName) return true;
              // Fallback mappings for food
              if (searchName.includes("food") && (nameLower.includes("food") || nameLower.includes("dining"))) return true;
              return false;
            });
            if (foundCat) {
              setNewCategory(foundCat._id);
            } else {
              setNewCategory(editingTransaction.category);
            }
          } else {
            setNewCategory(prev => {
              if (prev && catData.some(c => c._id === prev)) return prev;
              return catData[0]._id;
            });
          }
        } else {
          setCategories([]);
          if (!editingTransaction) setNewCategory("");
        }
        
        if (Array.isArray(payData) && payData.length > 0) {
          setPaymentMethods(payData);
          if (editingTransaction) {
            const foundPay = payData.find(p => p._id === editingTransaction.paymentMethod || p.name === editingTransaction.paymentMethod);
            if (foundPay) {
              setNewPayment(foundPay._id);
            } else {
              setNewPayment(editingTransaction.paymentMethod);
            }
          } else {
            setNewPayment(prev => {
              if (prev && payData.some(p => p._id === prev)) return prev;
              return payData[0]._id;
            });
          }
        } else {
          setPaymentMethods([]);
          if (!editingTransaction) setNewPayment("");
        }
      } catch (error) {
        console.error("Failed to fetch modal data:", error);
      }
    };

    fetchData();
  }, [isExpenseModalOpen, editingTransaction]);

  // Automatically select the first subcategory (or empty) when category changes
  useEffect(() => {
    const selectedCat = categories.find(c => c._id === newCategory);
    if (selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0) {
      const isSameCategory = editingTransaction && 
        (editingTransaction.category === newCategory || 
         categories.find(c => c.name === editingTransaction.category)?._id === newCategory);
      if (isSameCategory) {
        setNewSubCategory(editingTransaction.subCategory || "");
      } else {
        setNewSubCategory(selectedCat.subcategories[0]._id || "");
      }
    } else {
      setNewSubCategory("");
    }
  }, [newCategory, categories, editingTransaction]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (amountError) setAmountError(false);
    const val = e.target.value;
    // Remove commas to get raw numeric value
    const rawValue = val.replace(/,/g, '');
    
    // Only allow up to 7 digits in integer part and a single decimal point with max 2 digits after it
    if (rawValue !== '' && !/^\d{0,7}\.?\d{0,2}$/.test(rawValue)) return;
    
    // Format for display
    if (rawValue === '') {
      setNewAmount('');
    } else {
      const parts = rawValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setNewAmount(parts.join('.'));
    }
  };

  const handleAddTransaction = async (e?: React.FormEvent, closeAfter: boolean = true) => {
    if (e) e.preventDefault();
    
    if (!newAmount || parseFloat(newAmount.replace(/,/g, '')) === 0) {
      setAmountError(true);
      return;
    }
    
    // Strip commas for calculation
    const amountNum = parseFloat(newAmount.replace(/,/g, ''));
    
    // Find the selected category to check its type
    const selectedCat = categories.find(c => c._id === newCategory);
    const isIncome = selectedCat ? selectedCat.type === "income" : false;

    try {
      const data = {
        name: newName || selectedCat?.name || "General",
        category: newCategory,
        subCategory: newSubCategory || "",
        amount: isIncome ? Math.abs(amountNum) : -Math.abs(amountNum),
        date: newDate,
        paymentMethod: newPayment,
      };

      let savedTx;
      if (editingTransaction && editingTransaction._id) {
        savedTx = await transactionService.update(editingTransaction._id, data);
      } else {
        savedTx = await transactionService.create(data);
      }

      if (onSuccess) {
        onSuccess(savedTx);
      }
      
      if (closeAfter) {
        closeExpenseModal();
        router.refresh();
        openGlobalModal({
          header: "Save Completed",
          message: "The transaction has been successfully recorded.",
          type: "success",
          mainButton: {
            label: "Close",
            onClick: () => {}
          }
        });
      }
      
      // Reset Form
      setNewName("");
      setNewAmount("");
      setNewSubCategory("");
      setAmountError(false);
    } catch (error) {
      console.error("Save transaction error:", error);
      openGlobalModal({
        header: "Error",
        message: "Failed to save the transaction.",
        type: "error",
        mainButton: {
          label: "Close",
          onClick: () => {}
        }
      });
    }
  };

  return (
    <AnimatePresence>
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeExpenseModal}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight uppercase font-mono">
                  {editingTransaction && editingTransaction._id ? "Edit Record" : "New Record"}
                </h2>
                <button onClick={closeExpenseModal} className="w-8 h-8 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                {/* Amount Field - Wrapped in a clean container */}
                <div className="py-4 px-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1.5 font-mono">THB</span>
                    <input
                      required
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={handleAmountChange}
                      className={`p-1 bg-transparent border-none text-left text-4xl font-black placeholder:text-slate-300 focus:ring-0 selection:bg-[#FF9D00]/30 w-[180px] transition-all font-mono ${
                        amountError ? "text-red-500" : "text-[#1A1A1A]"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Category</label>
                      <div className="relative">
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs font-bold text-[#1A1A1A] appearance-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
                        >
                          {categories.length > 0 && 
                            categories.map(cat => <option key={cat._id || cat.name} value={cat._id}>{cat.icon} {cat.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Payment</label>
                      <div className="relative">
                        <select
                          value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs font-bold text-[#1A1A1A] appearance-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
                        >
                          {paymentMethods.length > 0 &&
                            paymentMethods.map(pm => <option key={pm._id || pm.name} value={pm._id}>💰 {pm.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Subcategory selection if the selected category has any */}
                  {(() => {
                    const selectedCat = categories.find(c => c._id === newCategory);
                    const currentSubcategories = selectedCat?.subcategories || [];
                    const selectedCatHasSubcategories = currentSubcategories.length > 0;
                    
                    return selectedCatHasSubcategories && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Subcategory</label>
                        <div className="relative">
                          <select
                            value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs font-bold text-[#1A1A1A] appearance-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
                          >
                            <option value="">None (General)</option>
                            {currentSubcategories.map((sub: any) => (
                              <option key={sub._id || sub.name} value={sub._id}>🎯 {sub.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </motion.div>
                    );
                  })()}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs font-bold text-[#1A1A1A] focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Description</label>
                    <input
                      type="text"
                      placeholder={`e.g. ${categories.find(c => c._id === newCategory)?.name || 'Lunch at Siam'}`}
                      maxLength={50}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-xl text-sm font-bold text-[#1A1A1A] placeholder:text-slate-400 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#FF9D00] shadow-md shadow-black/10 transition-colors cursor-pointer"
                  >
                    Confirm Record
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTransaction(undefined, false)}
                    className="w-14 py-4 bg-slate-100 border border-slate-200/50 text-[#1A1A1A] rounded-xl font-black text-xl hover:bg-[#FF9D00] hover:text-white transition-all flex items-center justify-center group cursor-pointer"
                    title="Add and keep open"
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

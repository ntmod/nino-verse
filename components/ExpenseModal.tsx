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
  const { isExpenseModalOpen, closeExpenseModal, onSuccess, editingTransaction } = useModal();
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
      setNewName(editingTransaction.name);
      // Format amount with commas and 2 decimals
      const absAmount = Math.abs(editingTransaction.amount);
      const parts = absAmount.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (parts[1]) parts[1] = parts[1].substring(0, 2);
      setNewAmount(parts.join('.'));
      
      setNewCategory(editingTransaction.category);
      setNewSubCategory(editingTransaction.subCategory || "");
      setNewPayment(editingTransaction.paymentMethod);
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
          if (!editingTransaction) {
            setNewCategory(prev => {
              if (prev && catData.some(c => c.name === prev)) return prev;
              return catData[0].name;
            });
          }
        } else {
          setCategories([]);
          if (!editingTransaction) setNewCategory("");
        }
        
        if (Array.isArray(payData) && payData.length > 0) {
          setPaymentMethods(payData);
          if (!editingTransaction) {
            setNewPayment(prev => {
              if (prev && payData.some(p => p.name === prev)) return prev;
              return payData[0].name;
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
    const selectedCat = categories.find(c => c.name === newCategory);
    if (selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0) {
      if (editingTransaction && editingTransaction.category === newCategory) {
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
    const selectedCat = categories.find(c => c.name === newCategory);
    const isIncome = selectedCat ? selectedCat.type === "income" : newCategory === "Income";

    try {
      const data = {
        name: newName || newCategory,
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
      }
      
      // Reset Form
      setNewName("");
      setNewAmount("");
      setNewSubCategory("");
      setAmountError(false);
    } catch (error) {
      console.error("Save transaction error:", error);
      alert("Failed to save transaction");
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-black tracking-tight uppercase">
                  {editingTransaction && editingTransaction._id ? "Edit Record" : "New Record"}
                </h2>
                <button onClick={closeExpenseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                {/* Amount Field - High Prominence */}
                <div className="py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-black text-black uppercase tracking-widest mt-1">THB</span>
                    <input
                      required
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={handleAmountChange}
                      className={`p-2 bg-transparent border-none text-left text-4xl font-black placeholder:text-black/5 focus:ring-0 selection:bg-[#FF9D00]/30 w-[240px] transition-all ${
                        amountError ? "text-red-500 ring-2 ring-red-500 rounded-xl" : "text-black"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-black uppercase tracking-widest">Category</label>
                      <div className="relative">
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold text-black appearance-none focus:ring-2 focus:ring-[#FF9D00]/20 transition-all"
                        >
                          {categories.length > 0 && 
                            categories.map(cat => <option key={cat._id || cat.name} value={cat.name}>{cat.icon} {cat.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-black uppercase tracking-widest">Payment</label>
                      <div className="relative">
                        <select
                          value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold text-black appearance-none focus:ring-2 focus:ring-[#FF9D00]/20 transition-all"
                        >
                          {paymentMethods.length > 0 &&
                            paymentMethods.map(pm => <option key={pm._id || pm.name} value={pm.name}>💰 {pm.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Subcategory selection if the selected category has any */}
                  {(() => {
                    const selectedCat = categories.find(c => c.name === newCategory);
                    const currentSubcategories = selectedCat?.subcategories || [];
                    const selectedCatHasSubcategories = currentSubcategories.length > 0;
                    
                    return selectedCatHasSubcategories && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        <label className="text-[10px] font-black text-black uppercase tracking-widest">Subcategory</label>
                        <div className="relative">
                          <select
                            value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold text-black appearance-none focus:ring-2 focus:ring-[#FF9D00]/20 transition-all"
                          >
                            <option value="">None (General)</option>
                            {currentSubcategories.map((sub: any) => (
                              <option key={sub._id || sub.name} value={sub._id}>🎯 {sub.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                        </div>
                      </motion.div>
                    );
                  })()}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-[#FF9D00]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Description</label>
                    <input
                      type="text"
                      placeholder={`e.g. ${newCategory || 'Lunch at Siam'}`}
                      maxLength={50}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-[#FF9D00]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-black text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#FF9D00] transition-colors"
                  >
                    Confirm Record
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTransaction(undefined, false)}
                    className="w-14 py-4 bg-gray-100 text-black rounded-xl font-black text-xl hover:bg-[#FF9D00] hover:text-white transition-colors flex items-center justify-center group"
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

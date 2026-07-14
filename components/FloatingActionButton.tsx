'use client'

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useModal } from "@/lib/modal-context";

interface FloatingActionButtonProps {
  onSuccess?: (newTx?: any) => void;
}

export default function FloatingActionButton({ onSuccess }: FloatingActionButtonProps) {
  const { openExpenseModal } = useModal();

  return (
    <motion.button
      onClick={() => openExpenseModal(onSuccess)}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-[#FF9D00] text-white rounded-full flex items-center justify-center z-50 group cursor-pointer"
    >
      <Plus className="w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:scale-110" />
    </motion.button>
  );
}

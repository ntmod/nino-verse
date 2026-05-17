'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModal } from "@/lib/modal-context";

export default function GlobalModal() {
  const { isGlobalModalOpen, globalModalConfig, closeGlobalModal } = useModal();

  if (!globalModalConfig) return null;

  const { header, message, mainButton, subButton, type } = globalModalConfig;

  // Map type to corresponding GIF path
  const gifType = type === 'danger' ? 'error' : type;
  const gifPath = `/animations/nori/popup/cat-popup-${gifType}.gif`;

  return (
    <AnimatePresence>
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGlobalModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-48 h-48 relative rounded-3xl overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">
                <img
                  src={gifPath}
                  alt={header}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">{header}</h2>
                <p className="text-[13px] font-bold text-gray-400 leading-relaxed px-2">
                  {message}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    mainButton.onClick();
                    closeGlobalModal();
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-[0.98] ${
                    mainButton.color || "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {mainButton.label}
                </button>
                
                {subButton && (
                  <button
                    onClick={() => {
                      subButton.onClick();
                      closeGlobalModal();
                    }}
                    className="w-full py-3 rounded-xl font-bold text-[10px] text-gray-300 uppercase tracking-[0.2em] hover:text-black transition-colors"
                  >
                    {subButton.label}
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={closeGlobalModal} 
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModal } from "@/lib/modal-context";

export default function GlobalModal() {
  const { isGlobalModalOpen, globalModalConfig, closeGlobalModal } = useModal();

  if (!globalModalConfig) return null;

  const { header, message, mainButton, subButton, type } = globalModalConfig;

  // Map type to the transparent animation.
  const animationType = type === 'danger' ? 'error' : type;
  const animationPath = `/animations/nori/popup/cat-popup-${animationType}.webp`;

  return (
    <AnimatePresence>
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGlobalModal}
            className="absolute inset-0 bg-[#292722]/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-h-[85dvh] relative w-full max-w-sm bg-[#fffdf5] rounded-none shadow-2xl overflow-y-auto"
          >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-48 h-48 relative rounded-3xl overflow-hidden mb-2 bg-[#f5eedf] flex items-center justify-center">
                <img
                  src={animationPath}
                  alt={header}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#292722] tracking-tighter uppercase leading-none">{header}</h2>
                <p className="text-[13px] font-bold text-[#7f715d] leading-relaxed px-2">
                  {message}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    mainButton.onClick();
                    closeGlobalModal();
                  }}
                  className={`w-full py-4 rounded-none font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-[0.98] ${
                    mainButton.color || "bg-[#e9a342] text-[#372b1c] hover:bg-[#403b32]"
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
                    className="w-full py-3 rounded-xl font-bold text-[10px] text-[#93846b] uppercase tracking-[0.2em] hover:text-[#292722] transition-colors"
                  >
                    {subButton.label}
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={closeGlobalModal} 
              className="absolute top-6 right-6 p-2 hover:bg-[#eee5d6] rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-[#93846b]" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

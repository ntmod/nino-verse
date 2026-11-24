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
            className="absolute inset-0 bg-foreground/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-h-[85dvh] relative w-full max-w-sm bg-card rounded-md shadow-2xl overflow-y-auto"
          >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-48 h-48 relative rounded-md overflow-hidden mb-2 bg-secondary flex items-center justify-center">
                <img
                  src={animationPath}
                  alt={header}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">{header}</h2>
                <p className="text-[13px] font-bold text-muted-foreground leading-relaxed px-2">
                  {message}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    mainButton.onClick();
                    closeGlobalModal();
                  }}
                  className={`w-full py-4 rounded-md font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-[0.98] ${
                    mainButton.color || "bg-highlight text-highlight-foreground hover:bg-foreground"
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
                    className="w-full py-3 rounded-md font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] hover:text-foreground transition-colors"
                  >
                    {subButton.label}
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={closeGlobalModal} 
              className="absolute top-6 right-6 p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

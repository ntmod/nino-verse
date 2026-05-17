'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalModalConfig {
  header: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'delete' | 'error';
  mainButton: {
    label: string;
    onClick: () => void;
    color?: string;
  };
  subButton?: {
    label: string;
    onClick: () => void;
  };
}

interface ModalContextType {
  isExpenseModalOpen: boolean;
  openExpenseModal: (onSuccess?: (transaction: any) => void, editingTransaction?: any) => void;
  closeExpenseModal: () => void;
  onSuccess?: (transaction: any) => void;
  editingTransaction?: any;
  
  // Global Modal
  isGlobalModalOpen: boolean;
  globalModalConfig: GlobalModalConfig | null;
  openGlobalModal: (config: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<((transaction: any) => void) | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<any>(undefined);

  // Global Modal State
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalModalConfig, setGlobalModalConfig] = useState<GlobalModalConfig | null>(null);

  const openExpenseModal = (onSuccess?: (transaction: any) => void, transaction?: any) => {
    setOnSuccessCallback(() => onSuccess);
    setEditingTransaction(transaction);
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setOnSuccessCallback(undefined);
    setEditingTransaction(undefined);
  };

  const openGlobalModal = (config: GlobalModalConfig) => {
    setGlobalModalConfig(config);
    setIsGlobalModalOpen(true);
  };

  const closeGlobalModal = () => {
    setIsGlobalModalOpen(false);
    setGlobalModalConfig(null);
  };

  return (
    <ModalContext.Provider
      value={{
        isExpenseModalOpen,
        openExpenseModal,
        closeExpenseModal,
        onSuccess: onSuccessCallback,
        editingTransaction,
        isGlobalModalOpen,
        globalModalConfig,
        openGlobalModal,
        closeGlobalModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

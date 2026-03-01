"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type RelationshipOption = "Mum" | "Dad" | "Partner" | "Friend" | "Grandparent" | "Other" | "";

export type ConversionFlowState = {
  occasion: string;
  recipientName: string;
  relationship: RelationshipOption;
  giftMessage: string;
  deliveryDate: string;
  includeGiftMessage: boolean;
  selectedUpsells: string[];
  bundleChoice: string;
};

type ConversionFlowContextShape = {
  state: ConversionFlowState;
  updateState: (patch: Partial<ConversionFlowState>) => void;
  resetFlow: () => void;
};

const STORAGE_KEY = "keepsy-conversion-flow-v1";

const defaultState: ConversionFlowState = {
  occasion: "",
  recipientName: "",
  relationship: "",
  giftMessage: "",
  deliveryDate: "",
  includeGiftMessage: false,
  selectedUpsells: [],
  bundleChoice: "",
};

const ConversionFlowContext = createContext<ConversionFlowContextShape | null>(null);

export function ConversionFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConversionFlowState>(() => {
    if (typeof window === "undefined") return defaultState;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    try {
      const parsed = JSON.parse(raw) as Partial<ConversionFlowState>;
      return { ...defaultState, ...parsed };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return defaultState;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<ConversionFlowContextShape>(
    () => ({
      state,
      updateState: (patch) => setState((prev) => ({ ...prev, ...patch })),
      resetFlow: () => setState(defaultState),
    }),
    [state],
  );

  return <ConversionFlowContext.Provider value={value}>{children}</ConversionFlowContext.Provider>;
}

export function useConversionFlow() {
  const ctx = useContext(ConversionFlowContext);
  if (!ctx) {
    throw new Error("useConversionFlow must be used inside ConversionFlowProvider");
  }
  return ctx;
}


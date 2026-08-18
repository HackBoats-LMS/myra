"use client";
import React, { createContext, useContext, useReducer, useCallback } from "react";
import dynamic from "next/dynamic";
import { toggleCompare as toggleCompareAction, clearCompare as clearCompareAction } from "@/actions/compare";

// Code-split the compare tray so its JS only loads on the client when needed.
const CompareTray = dynamic(() => import("@/app/(storefront)/compare/_components/CompareTray"), { ssr: false });

interface CompareContextType {
  compareIds: string[];
  isInCompare: (productId: string) => boolean;
  toggleCompare: (productId: string) => Promise<void>;
  clearCompare: () => Promise<void>;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

type CompareState = string[];
type CompareAction = { type: "SET"; ids: string[] };

function compareReducer(_state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "SET":
      return action.ids;
    default:
      return _state;
  }
}

export function CompareProvider({ children, initialIds }: { children: React.ReactNode; initialIds: string[] }) {
  const [compareIds, dispatch] = useReducer(compareReducer, initialIds);

  const toggleCompare = useCallback(async (productId: string) => {
    const next = await toggleCompareAction(productId);
    dispatch({ type: "SET", ids: next });
  }, []);

  const clearCompare = useCallback(async () => {
    const next = await clearCompareAction();
    dispatch({ type: "SET", ids: next });
  }, []);

  const isInCompare = useCallback((productId: string) => compareIds.includes(productId), [compareIds]);

  return (
    <CompareContext.Provider value={{ compareIds, isInCompare, toggleCompare, clearCompare }}>
      {children}
      <CompareTray compareIds={compareIds} onClear={clearCompare} />
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
"use client";
import React, { createContext, useContext, useReducer } from "react";

interface WishlistContextType {
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

type WishlistAction = { type: "OPEN" } | { type: "CLOSE" };

function wishlistReducer(state: boolean, action: WishlistAction): boolean {
  switch (action.type) {
    case "OPEN":
      return true;
    case "CLOSE":
      return false;
    default:
      return state;
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [isWishlistOpen, dispatch] = useReducer(wishlistReducer, false);

  const openWishlist = () => dispatch({ type: "OPEN" });
  const closeWishlist = () => dispatch({ type: "CLOSE" });

  return (
    <WishlistContext.Provider value={{ isWishlistOpen, openWishlist, closeWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistDrawer() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlistDrawer must be used within a WishlistProvider");
  }
  return context;
}

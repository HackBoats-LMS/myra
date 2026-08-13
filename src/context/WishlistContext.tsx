"use client";
import React, { createContext, useContext, useState } from "react";

interface WishlistContextType {
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

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
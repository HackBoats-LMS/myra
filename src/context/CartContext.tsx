"use client";
import React, { createContext, useContext, useReducer } from "react";

interface CartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction = { type: "OPEN" } | { type: "CLOSE" };

function cartReducer(state: boolean, action: CartAction): boolean {
  switch (action.type) {
    case "OPEN":
      return true;
    case "CLOSE":
      return false;
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, dispatch] = useReducer(cartReducer, false);

  const openCart = () => dispatch({ type: "OPEN" });
  const closeCart = () => dispatch({ type: "CLOSE" });

  return (
    <CartContext.Provider value={{ isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartDrawer must be used within a CartProvider");
  }
  return context;
}

"use client";
import React, { createContext, useContext, useReducer, useEffect } from "react";

interface CartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
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

export function CartProvider({ children, initialCartCount = 0 }: { children: React.ReactNode; initialCartCount?: number }) {
  const [isCartOpen, dispatch] = useReducer(cartReducer, false);
  const [cartCount, setCartCount] = React.useState(initialCartCount);

  // Sync with server if initialCartCount changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  const openCart = () => dispatch({ type: "OPEN" });
  const closeCart = () => dispatch({ type: "CLOSE" });

  return (
    <CartContext.Provider value={{ isCartOpen, openCart, closeCart, cartCount, setCartCount }}>
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

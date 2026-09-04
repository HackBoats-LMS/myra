"use client";

import { useEffect } from "react";

export default function InvoiceClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inject a script or handle any client side logic for print if needed.
    // In our case, the print button will just call window.print().
  }, []);

  return <>{children}</>;
}

import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";

/** Shared storefront chrome (navbar) wrapping public + customer pages. */
export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

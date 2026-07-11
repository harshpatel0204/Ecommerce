import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/index.css";
import { initAnalytics } from "@/lib/analytics";

// Initialise PostHog + GA4 before the first render so page-view
// tracking is ready by the time the router mounts.
initAnalytics();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* v7_startTransition: navigations that suspend (lazy page chunks)
            keep the CURRENT page on screen instead of collapsing the whole
            viewport into the Suspense fallback. */}
        <BrowserRouter future={{ v7_startTransition: true }}>
          <App />
          <Toaster richColors position="top-center" />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

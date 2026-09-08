"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Inside the query provider, because mutation hooks call useToast. */}
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

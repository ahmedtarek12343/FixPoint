"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { analyticsQueryOptions } from "@/lib/queries/analytics";

export function useAnalytics() {
  return useSuspenseQuery(analyticsQueryOptions());
}

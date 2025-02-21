"use client";

import React, { ReactNode, useState } from "react";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    new QueryClient({
      // defaultOptions: {
      //   queries: {
      //     retry: 1,
      //     staleTime: 30000,
      //     refetchOnWindowFocus: false,
      //   },
      // },
    })
  );

  return (
    <QueryClientProvider client={client}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    </QueryClientProvider>
  );
}

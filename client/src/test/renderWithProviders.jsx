import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Renders a delivery component with the providers it actually depends on:
 * react-query for the service setting and the mutations, and a router for the
 * "Go to Settings" path out of the disabled-service dialog.
 */
export function renderWithProviders(ui, { route = "/orders" } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

export function billWithStatus(status, metadata = {}) {
  return {
    order_id: "bill-1",
    order_no: 101,
    mobile: "9876543210",
    whatsapp_metadata: { status, ...metadata },
  };
}

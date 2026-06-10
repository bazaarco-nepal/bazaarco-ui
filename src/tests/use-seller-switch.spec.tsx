import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Switching the active store is store-scoped server-side, so the client must
// refresh BOTH the seller workspace (["seller"]) and chat (["chat"]) — otherwise
// the inbox/unread badge keep showing the previous store's threads.
vi.mock("@/services/api/seller-organization", () => ({
  sellerOrganizationApi: {
    getOrganization: vi.fn(),
    setupOrganization: vi.fn(),
    createStore: vi.fn(),
    switchActiveStore: vi.fn(),
  },
}));

import { sellerOrganizationApi } from "@/services/api/seller-organization";
import { useSwitchActiveStore } from "@/hooks/use-seller";
import { queryKeys } from "@/services/api/query-keys";

const mockedApi = sellerOrganizationApi as unknown as {
  switchActiveStore: ReturnType<typeof vi.fn>;
};

let client: QueryClient;
function wrapper() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSwitchActiveStore", () => {
  it("primes the organization cache and invalidates both seller and chat queries", async () => {
    const freshOrg = { linked: true, sellerId: "shop_b", stores: [] };
    mockedApi.switchActiveStore.mockResolvedValue(freshOrg);

    const { result } = renderHook(() => useSwitchActiveStore(), { wrapper: wrapper() });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    await result.current.mutateAsync("shop_b");

    expect(mockedApi.switchActiveStore).toHaveBeenCalledWith("shop_b");
    await waitFor(() =>
      expect(client.getQueryData(queryKeys.seller.organization)).toEqual(freshOrg),
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(["seller"]);
    expect(invalidatedKeys).toContainEqual(["chat"]);
  });
});

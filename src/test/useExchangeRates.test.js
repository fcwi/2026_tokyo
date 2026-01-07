import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useExchangeRates } from "../hooks/useExchangeRates";

// Mock fetch
vi.stubGlobal("fetch", vi.fn());

describe("useExchangeRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useExchangeRates("jpy", "twd", true));
    expect(result.current.loading).toBe(true);
  });

  it("should fetch rates successfully", async () => {
    const mockData = {
      jpy: { twd: 0.211 },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useExchangeRates("jpy", "twd", true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.current).toBe(0.211);
    expect(result.current.error).toBe(false);
  });

  it("should handle error when API fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useExchangeRates("jpy", "twd", true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
  });

  it("should handle offline state", async () => {
    const { result } = renderHook(() => useExchangeRates("jpy", "twd", false));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.current).toBeNull();
  });
});

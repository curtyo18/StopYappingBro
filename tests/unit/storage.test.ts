import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_PROMPT,
  getCustomPrompt,
  setCustomPrompt,
  resetCustomPrompt,
} from "@/common/storage";

const store = new Map<string, unknown>();

const local = {
  get: vi.fn(async (key: string) => {
    return store.has(key) ? { [key]: store.get(key) } : {};
  }),
  set: vi.fn(async (items: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(items)) store.set(k, v);
  }),
  remove: vi.fn(async (key: string) => {
    store.delete(key);
  }),
};

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  // @ts-expect-error minimal chrome stub for the storage wrapper under test
  globalThis.chrome = { storage: { local } };
});

describe("getCustomPrompt", () => {
  it("returns the default prompt when nothing is stored", async () => {
    expect(await getCustomPrompt()).toBe(DEFAULT_PROMPT);
  });

  it("returns the stored prompt when present", async () => {
    store.set("customPrompt", "my custom prompt");
    expect(await getCustomPrompt()).toBe("my custom prompt");
  });

  it("falls back to the default when storage throws", async () => {
    local.get.mockRejectedValueOnce(new Error("boom"));
    expect(await getCustomPrompt()).toBe(DEFAULT_PROMPT);
  });

  it("falls back to the default for an empty stored value", async () => {
    store.set("customPrompt", "");
    expect(await getCustomPrompt()).toBe(DEFAULT_PROMPT);
  });
});

describe("setCustomPrompt", () => {
  it("persists the prompt under the customPrompt key", async () => {
    await setCustomPrompt("hello");
    expect(store.get("customPrompt")).toBe("hello");
    expect(local.set).toHaveBeenCalledWith({ customPrompt: "hello" });
  });

  it("swallows storage errors without throwing", async () => {
    local.set.mockRejectedValueOnce(new Error("boom"));
    await expect(setCustomPrompt("x")).resolves.toBeUndefined();
  });
});

describe("resetCustomPrompt", () => {
  it("removes the stored prompt", async () => {
    store.set("customPrompt", "to-be-removed");
    await resetCustomPrompt();
    expect(store.has("customPrompt")).toBe(false);
    expect(local.remove).toHaveBeenCalledWith("customPrompt");
  });

  it("swallows storage errors without throwing", async () => {
    local.remove.mockRejectedValueOnce(new Error("boom"));
    await expect(resetCustomPrompt()).resolves.toBeUndefined();
  });
});

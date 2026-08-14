import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_EXPIRED_EVENT,
  apiRequest,
  parseResponseBody,
  setToken,
} from "./client";

describe("parseResponseBody", () => {
  it("returns JSON or a safe fallback", () => {
    expect(parseResponseBody('{"ok":true}')).toEqual({ ok: true });
    expect(parseResponseBody("")).toEqual({});
    expect(parseResponseBody("<html>nope</html>")).toEqual({
      message: "Unexpected response from server",
    });
  });
});

describe("apiRequest", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears the session on an authenticated 401", async () => {
    setToken("expired");
    vi.mocked(fetch).mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => '{"message":"Unauthorized"}',
    } as Response);

    await expect(apiRequest("/policies")).rejects.toMatchObject({
      status: 401,
    });
    expect(store.has("pm_access_token")).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_EXPIRED_EVENT }),
    );
  });

  it("does not clear the session on a login 401", async () => {
    setToken("keep-me");
    vi.mocked(fetch).mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => '{"message":"Invalid email or password"}',
    } as Response);

    await expect(
      apiRequest("/auth/login", { auth: false, method: "POST", body: {} }),
    ).rejects.toMatchObject({ status: 401 });
    expect(store.get("pm_access_token")).toBe("keep-me");
  });
});

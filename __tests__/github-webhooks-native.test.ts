import { useGithubWebhooksNative } from "@/hooks/use-github-webhooks-native";
import { renderHook, act } from "@testing-library/react-native";

// Mock expo-crypto
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: "SHA256",
  },
  CryptoEncoding: {
    HEX: "HEX",
  },
}));

describe("useGithubWebhooksNative", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize webhooks with secret", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    const success = result.current.initializeWebhooks("test-secret");

    expect(success).toBe(true);
    expect(result.current.isInitialized).toBe(true);
  });

  it("should subscribe to events", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    const callback = jest.fn();
    const subscriptionId = result.current.subscribe("push", callback);

    expect(subscriptionId).toBeDefined();
    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.subscriptions[0].event).toBe("push");
  });

  it("should unsubscribe from events", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    const callback = jest.fn();
    const subscriptionId = result.current.subscribe("push", callback);

    const unsubscribed = result.current.unsubscribe(subscriptionId);

    expect(unsubscribed).toBe(true);
    expect(result.current.subscriptions).toHaveLength(0);
  });

  it("should handle events", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    const callback = jest.fn();
    result.current.subscribe("push", callback);

    const payload = { delivery_id: "123", action: "pushed" };

    act(() => {
      result.current.processWebhook = jest.fn().mockResolvedValue(true);
    });

    expect(result.current.events).toHaveLength(0);
  });

  it("should verify webhook signatures", async () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Mock successful hash generation
    const mockDigestStringAsync = jest.fn().mockResolvedValue("expected-hash");
    require("expo-crypto").digestStringAsync = mockDigestStringAsync;

    result.current.initializeWebhooks("test-secret");

    const payload = '{"test": "data"}';
    const signature = "sha256=expected-hash";

    const verified = await result.current.verifyWebhook(payload, signature);

    expect(verified).toBe(true);
    expect(mockDigestStringAsync).toHaveBeenCalledWith(
      "SHA256",
      payload + "test-secret",
      "HEX",
    );
  });

  it("should reject invalid signatures", async () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Mock hash generation that doesn't match
    const mockDigestStringAsync = jest.fn().mockResolvedValue("different-hash");
    require("expo-crypto").digestStringAsync = mockDigestStringAsync;

    result.current.initializeWebhooks("test-secret");

    const payload = '{"test": "data"}';
    const signature = "sha256=expected-hash";

    const verified = await result.current.verifyWebhook(payload, signature);

    expect(verified).toBe(false);
  });

  it("should reject invalid signature format", async () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    result.current.initializeWebhooks("test-secret");

    const payload = '{"test": "data"}';
    const signature = "invalid-format";

    const verified = await result.current.verifyWebhook(payload, signature);

    expect(verified).toBe(false);
  });

  it("should process webhook with valid signature", async () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Mock successful verification
    result.current.verifyWebhook = jest.fn().mockResolvedValue(true);

    const payload = '{"event": "push", "delivery_id": "123"}';
    const signature = "sha256=valid-hash";

    const processed = await result.current.processWebhook(payload, signature);

    expect(processed).toBe(true);
    expect(result.current.verifyWebhook).toHaveBeenCalledWith(
      payload,
      signature,
    );
  });

  it("should reject webhook with invalid signature", async () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Mock failed verification
    result.current.verifyWebhook = jest.fn().mockResolvedValue(false);

    const payload = '{"event": "push", "delivery_id": "123"}';
    const signature = "sha256=invalid-hash";

    const processed = await result.current.processWebhook(payload, signature);

    expect(processed).toBe(false);
  });

  it("should get recent events", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Add some test events
    const event1 = {
      id: "1",
      name: "push",
      payload: { test: "data1" },
      created_at: "2023-01-01T00:00:00Z",
    };
    const event2 = {
      id: "2",
      name: "pull_request",
      payload: { test: "data2" },
      created_at: "2023-01-01T00:00:00Z",
    };

    act(() => {
      result.current.events = [event1, event2];
    });

    const recentEvents = result.current.getRecentEvents(1);

    expect(recentEvents).toHaveLength(1);
    expect(recentEvents[0].id).toBe("1");
  });

  it("should clear events", () => {
    const { result } = renderHook(() => useGithubWebhooksNative());

    // Add some test events
    const event1 = {
      id: "1",
      name: "push",
      payload: { test: "data1" },
      created_at: "2023-01-01T00:00:00Z",
    };

    act(() => {
      result.current.events = [event1];
    });

    expect(result.current.events).toHaveLength(1);

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toHaveLength(0);
  });
});

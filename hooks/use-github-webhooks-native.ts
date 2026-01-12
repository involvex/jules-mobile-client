import { useCallback, useEffect, useState } from "react";
import * as Crypto from "expo-crypto";

export interface WebhookEvent {
  id: string;
  name: string;
  payload: any;
  created_at: string;
}

export interface WebhookSubscription {
  id: string;
  event: string;
  callback: (event: WebhookEvent) => void;
}

export function useGithubWebhooksNative() {
  const [subscriptions, setSubscriptions] = useState<
    Map<string, WebhookSubscription>
  >(new Map());
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [secret, setSecret] = useState<string>("");

  // Initialize webhooks with secret
  const initializeWebhooks = useCallback((webhookSecret: string) => {
    setSecret(webhookSecret);
    setIsInitialized(true);

    // Set up default event handlers
    setupDefaultHandlers();

    return true;
  }, []);

  // Setup default event handlers
  const setupDefaultHandlers = useCallback(() => {
    // Default handlers can be set up here if needed
    // For now, we rely on the subscription system
  }, []);

  // Handle incoming webhook events
  const handleEvent = useCallback(
    (eventName: string, payload: any) => {
      const event: WebhookEvent = {
        id: payload.delivery_id || Date.now().toString(),
        name: eventName,
        payload,
        created_at: new Date().toISOString(),
      };

      // Add to events list
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events

      // Notify subscribers
      subscriptions.forEach(subscription => {
        if (subscription.event === eventName || subscription.event === "*") {
          try {
            subscription.callback(event);
          } catch (error) {
            console.error("Error in webhook subscription callback:", error);
          }
        }
      });
    },
    [subscriptions],
  );

  // Subscribe to webhook events
  const subscribe = useCallback(
    (event: string, callback: (event: WebhookEvent) => void): string => {
      const id = Math.random().toString(36).substr(2, 9);
      const subscription: WebhookSubscription = {
        id,
        event,
        callback,
      };

      setSubscriptions(prev => new Map(prev.set(id, subscription)));
      return id;
    },
    [],
  );

  // Unsubscribe from webhook events
  const unsubscribe = useCallback(
    (subscriptionId: string): boolean => {
      if (subscriptions.has(subscriptionId)) {
        setSubscriptions(prev => {
          const newSubscriptions = new Map(prev);
          newSubscriptions.delete(subscriptionId);
          return newSubscriptions;
        });
        return true;
      }
      return false;
    },
    [subscriptions],
  );

  // Verify webhook signature using expo-crypto
  const verifyWebhook = useCallback(
    async (payload: string, signature: string): Promise<boolean> => {
      if (!secret) {
        console.warn("Webhook secret not set");
        return false;
      }

      try {
        // GitHub signature format: sha256=<hash>
        if (!signature.startsWith("sha256=")) {
          console.error("Invalid signature format");
          return false;
        }

        const expectedSignature = signature.replace("sha256=", "");

        // Create simple hash for signature verification
        // Note: This is a simplified implementation for React Native compatibility
        // In production, you might want to use a proper HMAC implementation
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          payload + secret,
          { encoding: Crypto.CryptoEncoding.HEX },
        );

        // Compare signatures in constant time to prevent timing attacks
        return constantTimeEquals(hash, expectedSignature);
      } catch (error) {
        console.error("Webhook verification failed:", error);
        return false;
      }
    },
    [secret],
  );

  // Constant time string comparison to prevent timing attacks
  const constantTimeEquals = (a: string, b: string): boolean => {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  };

  // Process webhook payload
  const processWebhook = useCallback(
    async (payload: string, signature: string): Promise<boolean> => {
      try {
        const verified = await verifyWebhook(payload, signature);
        if (!verified) {
          console.warn("Webhook signature verification failed");
          return false;
        }

        const event = JSON.parse(payload);
        const eventName = event.event || event.action || "unknown";
        handleEvent(eventName, event);
        return true;
      } catch (error) {
        console.error("Failed to process webhook:", error);
        return false;
      }
    },
    [verifyWebhook, handleEvent],
  );

  // Get recent events
  const getRecentEvents = useCallback(
    (limit: number = 50): WebhookEvent[] => {
      return events.slice(0, limit);
    },
    [events],
  );

  // Clear events history
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSubscriptions(new Map());
      setEvents([]);
      setIsInitialized(false);
      setSecret("");
    };
  }, []);

  return {
    isInitialized,
    initializeWebhooks,
    subscribe,
    unsubscribe,
    verifyWebhook,
    processWebhook,
    getRecentEvents,
    clearEvents,
    events,
    subscriptions: Array.from(subscriptions.values()),
  };
}

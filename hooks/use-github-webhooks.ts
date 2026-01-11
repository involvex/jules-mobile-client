import { useGithubWebhooksNative } from "./use-github-webhooks-native";
import { useCallback, useEffect, useState } from "react";

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

export function useGithubWebhooks() {
  const nativeWebhooks = useGithubWebhooksNative();
  const [subscriptions, setSubscriptions] = useState<
    Map<string, WebhookSubscription>
  >(new Map());
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize webhooks
  const initializeWebhooks = useCallback(
    (secret: string) => {
      try {
        const success = nativeWebhooks.initializeWebhooks(secret);
        if (success) {
          setIsInitialized(true);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to initialize webhooks:", error);
        return false;
      }
    },
    [nativeWebhooks],
  );

  // Setup default event handlers
  const setupDefaultHandlers = useCallback(() => {
    // Repository events
    nativeWebhooks.subscribe("repository.created", event => {
      handleEvent("repository.created", event);
    });

    nativeWebhooks.subscribe("repository.deleted", event => {
      handleEvent("repository.deleted", event);
    });

    // Push events
    nativeWebhooks.subscribe("push", event => {
      handleEvent("push", event);
    });

    // Pull request events
    nativeWebhooks.subscribe("pull_request.opened", event => {
      handleEvent("pull_request.opened", event);
    });

    nativeWebhooks.subscribe("pull_request.closed", event => {
      handleEvent("pull_request.closed", event);
    });

    // Workflow events
    nativeWebhooks.subscribe("workflow_run.completed", event => {
      handleEvent("workflow_run.completed", event);
    });

    nativeWebhooks.subscribe("workflow_run.requested", event => {
      handleEvent("workflow_run.requested", event);
    });
  }, [nativeWebhooks]);

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

  // Verify webhook signature
  const verifyWebhook = useCallback(
    async (payload: string, signature: string): Promise<boolean> => {
      return await nativeWebhooks.verifyWebhook(payload, signature);
    },
    [nativeWebhooks],
  );

  // Process webhook payload
  const processWebhook = useCallback(
    async (payload: string, signature: string): Promise<boolean> => {
      return await nativeWebhooks.processWebhook(payload, signature);
    },
    [nativeWebhooks],
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

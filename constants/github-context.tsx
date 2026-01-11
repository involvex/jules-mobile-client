import React, { createContext, ReactNode, useContext, useState } from "react";
import { useGithubDeepLinking } from "@/hooks/use-github-deep-linking";
import { useGithubWebhooks } from "@/hooks/use-github-webhooks";
import { useGithubSession } from "@/hooks/use-github-session";
import { useGithubApi } from "@/hooks/use-github-api";

interface GithubContextType {
  // API Integration
  api: ReturnType<typeof useGithubApi>;

  // Webhook Integration
  webhooks: ReturnType<typeof useGithubWebhooks>;

  // Deep Linking
  deepLinking: ReturnType<typeof useGithubDeepLinking>;

  // Session Management
  session: ReturnType<typeof useGithubSession>;

  // State management
  isGithubConnected: boolean;
  connectGithub: (token: string) => Promise<boolean>;
  disconnectGithub: () => void;
}

const GithubContext = createContext<GithubContextType | undefined>(undefined);

interface GithubProviderProps {
  children: ReactNode;
}

export function GithubProvider({ children }: GithubProviderProps) {
  const [isConnected, setIsConnected] = useState(false);

  // Initialize hooks
  const api = useGithubApi();
  const webhooks = useGithubWebhooks();
  const deepLinking = useGithubDeepLinking();
  const session = useGithubSession();

  // Connect to GitHub
  const connectGithub = async (token: string): Promise<boolean> => {
    try {
      // Set the token in the API context
      // Note: This assumes the API hook can accept token updates
      // You might need to trigger this through the API key context

      const isValid = await api.validateToken();
      if (isValid) {
        setIsConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to connect to GitHub:", error);
      return false;
    }
  };

  // Disconnect from GitHub
  const disconnectGithub = () => {
    setIsConnected(false);
    // Clear any stored tokens or state
  };

  const contextValue: GithubContextType = {
    api,
    webhooks,
    deepLinking,
    session,
    isGithubConnected: isConnected,
    connectGithub,
    disconnectGithub,
  };

  return (
    <GithubContext.Provider value={contextValue}>
      {children}
    </GithubContext.Provider>
  );
}

export function useGithub() {
  const context = useContext(GithubContext);
  if (!context) {
    throw new Error("useGithub must be used within a GithubProvider");
  }
  return context;
}

// Convenience hooks for specific functionality
export function useGithubApiIntegration() {
  const { api } = useGithub();
  return api;
}

export function useGithubWebhookIntegration() {
  const { webhooks } = useGithub();
  return webhooks;
}

export function useGithubDeepLinkingIntegration() {
  const { deepLinking } = useGithub();
  return deepLinking;
}

export function useGithubSessionIntegration() {
  const { session } = useGithub();
  return session;
}

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { storage } from "@/utils/storage";

const API_KEY_STORAGE_KEY = "jules_api_key";
const GITHUB_TOKEN_STORAGE_KEY = "github_token_secure";

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => Promise<void>;
  isLoaded: boolean;
  GITHUB_TOKEN: string;
  setGITHUB_TOKEN: (key: string) => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [GITHUB_TOKEN, setGITHUB_TOKENState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const [savedApiKey, savedGithubToken] = await Promise.all([
          storage.getItem(API_KEY_STORAGE_KEY),
          storage.getItem(GITHUB_TOKEN_STORAGE_KEY),
        ]);

        if (savedApiKey) {
          setApiKeyState(savedApiKey);
        }
        if (savedGithubToken) {
          setGITHUB_TOKENState(savedGithubToken);
        }
      } catch {
        // Ignore
      }
      setIsLoaded(true);
    };
    void loadKeys();
  }, []);

  // Save and update API key
  const setApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    try {
      if (key) {
        await storage.setItem(API_KEY_STORAGE_KEY, key);
      } else {
        await storage.deleteItem(API_KEY_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, []);

  const setGITHUB_TOKEN = useCallback(async (key: string) => {
    setGITHUB_TOKENState(key);
    try {
      if (key) {
        await storage.setItem(GITHUB_TOKEN_STORAGE_KEY, key);
      } else {
        await storage.deleteItem(GITHUB_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Wait for API key to load
  if (!isLoaded) {
    return null;
  }

  return (
    <ApiKeyContext.Provider
      value={{ apiKey, setApiKey, isLoaded, GITHUB_TOKEN, setGITHUB_TOKEN }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}

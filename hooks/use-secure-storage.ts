import { useCallback, useState } from "react";
import { storage } from "@/utils/storage";

const API_KEY_STORAGE_KEY = "jules_api_key";
const THEME_STORAGE_KEY = "jules_theme";
const LANGUAGE_STORAGE_KEY = "jules_language";

/**
 * storageを使用したセキュアストレージフック (Web/Native対応)
 */
export function useSecureStorage() {
  const [isLoading, setIsLoading] = useState(false);

  // APIキーの保存
  const saveApiKey = useCallback(async (key: string): Promise<void> => {
    setIsLoading(true);
    try {
      await storage.setItem(API_KEY_STORAGE_KEY, key);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // APIキーの取得
  const getApiKey = useCallback(async (): Promise<string | null> => {
    try {
      return await storage.getItem(API_KEY_STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  // APIキーの削除
  const deleteApiKey = useCallback(async (): Promise<void> => {
    try {
      await storage.deleteItem(API_KEY_STORAGE_KEY);
    } catch {
      // 無視
    }
  }, []);

  // テーマの保存
  const saveTheme = useCallback(
    async (theme: "light" | "dark"): Promise<void> => {
      try {
        await storage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // 無視
      }
    },
    [],
  );

  // テーマの取得
  const getTheme = useCallback(async (): Promise<"light" | "dark" | null> => {
    try {
      const theme = await storage.getItem(THEME_STORAGE_KEY);
      return theme as "light" | "dark" | null;
    } catch {
      return null;
    }
  }, []);

  // 言語の保存
  const saveLanguage = useCallback(async (lang: "ja" | "en"): Promise<void> => {
    try {
      await storage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // 無視
    }
  }, []);

  // 言語の取得
  const getLanguage = useCallback(async (): Promise<"ja" | "en" | null> => {
    try {
      const lang = await storage.getItem(LANGUAGE_STORAGE_KEY);
      return lang as "ja" | "en" | null;
    } catch {
      return null;
    }
  }, []);

  return {
    isLoading,
    saveApiKey,
    getApiKey,
    deleteApiKey,
    saveTheme,
    getTheme,
    saveLanguage,
    getLanguage,
  };
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Secure storage wrapper with web fallback
 */
export const storage = {
  /**
   * Save a value
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.warn(
          `SecureStore failed for key ${key}, falling back to AsyncStorage`,
          error,
        );
        await AsyncStorage.setItem(key, value);
      }
    }
  },

  /**
   * Get a value
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.warn(
          `SecureStore failed for key ${key}, falling back to AsyncStorage`,
          error,
        );
        return await AsyncStorage.getItem(key);
      }
    }
  },

  /**
   * Delete a value
   */
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.warn(
          `SecureStore failed for key ${key}, falling back to AsyncStorage`,
          error,
        );
        await AsyncStorage.removeItem(key);
      }
    }
  },
};

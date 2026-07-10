import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Storage keys
export const STORAGE_KEYS = {
  USER_SESSION: 'hitha_user_session',
  USERS_LIST: 'hitha_users_list',
  MOODS: 'hitha_moods_list',
  PLANS: 'hitha_plans_list',
  CHATS: 'hitha_chats_prefix_',
  SETTINGS: 'hitha_settings',
  SECURITY_PIN: 'hitha_app_lock_pin',
  PIN_ENABLED: 'hitha_pin_enabled',
};

/**
 * Secure Store Utility for sensitive information (e.g. passwords, secure tokens, lock PINs)
 */
export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`SecureStorage.setItem error for key ${key}:`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage.getItem error for key ${key}:`, error);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage.deleteItem error for key ${key}:`, error);
    }
  },
};

/**
 * Regular Local Storage Utility for standard application data (Moods, Chats, Actions)
 */
export const LocalStorage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`LocalStorage.setItem error for key ${key}:`, error);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (error) {
      console.error(`LocalStorage.getItem error for key ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`LocalStorage.removeItem error for key ${key}:`, error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURITY_PIN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_ENABLED);
    } catch (error) {
      console.error('LocalStorage.clearAll error:', error);
    }
  },
};

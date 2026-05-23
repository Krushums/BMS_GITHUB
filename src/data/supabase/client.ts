import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const memoryStorage = new Map<string, string>();
const storage =
  typeof window === "undefined"
    ? {
        async getItem(key: string) {
          return memoryStorage.get(key) ?? null;
        },
        async removeItem(key: string) {
          memoryStorage.delete(key);
        },
        async setItem(key: string, value: string) {
          memoryStorage.set(key, value);
        }
      }
    : AsyncStorage;

if (!isSupabaseConfigured) {
  console.warn("Supabase environment variables are not configured. Auth and data calls will fail.");
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage
    }
  }
);

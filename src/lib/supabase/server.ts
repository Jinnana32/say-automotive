import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

type CookieStore = {
  getAll: () => {
    name: string;
    value: string;
  }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options: CookieOptions;
    }[],
  ) => void;
};

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return { url, anonKey };
}

export function createSupabaseServerClient(cookieStore: CookieStore) {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        cookieStore.setAll(cookies);
      },
    },
  });
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Components may not be able to mutate cookies.
      }
    },
  });
}

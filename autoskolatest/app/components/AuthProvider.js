"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabaseBrowser";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    let subscription;

    try {
      const supabase = getSupabaseBrowserClient();
      setClient(supabase);

      supabase.auth.getSession().then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setAuthError(error.message);
        }

        setSession(data.session);
        setUser(data.session?.user || null);
        setLoading(false);
      });

      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user || null);
        setLoading(false);
      });

      subscription = listener.data.subscription;
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      client,
      session,
      user,
      loading,
      authError,
      accessToken: session?.access_token || "",
      signIn: (email, password) => {
        if (!client) {
          return Promise.resolve({
            error: {
              message: authError || "Přihlášení není dostupné.",
            },
          });
        }

        return client.auth.signInWithPassword({ email, password });
      },
      signUp: (email, password, fullName) => {
        if (!client) {
          return Promise.resolve({
            error: {
              message: authError || "Registrace není dostupná.",
            },
          });
        }

        return client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
      },
      signOut: () => client?.auth.signOut(),
    }),
    [authError, client, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth musí být použit uvnitř AuthProvider.");
  }

  return context;
}

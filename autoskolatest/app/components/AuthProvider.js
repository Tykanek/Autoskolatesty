"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabaseBrowser";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
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

        const nextUser = data.session?.user || null;

        setSession(data.session);
        setUser(nextUser);
        setRole(null);
        setRoleLoading(Boolean(nextUser));
        setLoading(false);
      });

      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        const nextUser = nextSession?.user || null;

        setSession(nextSession);
        setUser(nextUser);
        setRole(null);
        setRoleLoading(Boolean(nextUser));
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

  useEffect(() => {
    let active = true;

    if (!client || !user) {
      setRole(null);
      setRoleLoading(false);
      return undefined;
    }

    setRoleLoading(true);

    client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        setRole(data?.role || "user");
        setRoleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client, user]);

  const value = useMemo(
    () => ({
      client,
      session,
      user,
      role,
      isAdmin: role === "admin",
      roleLoading,
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
            emailRedirectTo: new URL("/auth", window.location.origin).toString(),
            data: {
              full_name: fullName,
            },
          },
        });
      },
      resendConfirmation: (email) => {
        if (!client) {
          return Promise.resolve({
            error: {
              message: authError || "Odeslání potvrzovacího e-mailu není dostupné.",
            },
          });
        }

        return client.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: new URL("/auth", window.location.origin).toString(),
          },
        });
      },
      signOut: () => client?.auth.signOut(),
    }),
    [authError, client, loading, role, roleLoading, session, user]
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

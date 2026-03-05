"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type liff from "@line/liff";

type Liff = typeof liff;

interface LiffContextValue {
  liff: Liff | null;
  isLoggedIn: boolean;
  isReady: boolean;
  error: string | null;
  accessToken: string | null;
}

const LiffContext = createContext<LiffContextValue>({
  liff: null,
  isLoggedIn: false,
  isReady: false,
  error: null,
  accessToken: null,
});

const isMockMode = process.env.NEXT_PUBLIC_MOCK_LIFF === "true";

export function LiffProvider({ children }: { children: ReactNode }) {
  const [liffInstance, setLiffInstance] = useState<Liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode) {
      setIsLoggedIn(true);
      setAccessToken("mock-access-token");
      setIsReady(true);
      return;
    }

    const initLiff = async () => {
      try {
        const liffModule = (await import("@line/liff")).default;
        await liffModule.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        setLiffInstance(liffModule);

        if (!liffModule.isLoggedIn()) {
          liffModule.login();
          return;
        }

        setIsLoggedIn(true);
        setAccessToken(liffModule.getAccessToken());
      } catch (e) {
        setError(e instanceof Error ? e.message : "LIFF initialization failed");
      } finally {
        setIsReady(true);
      }
    };

    initLiff();
  }, []);

  return (
    <LiffContext.Provider
      value={{ liff: liffInstance, isLoggedIn, isReady, error, accessToken }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  return useContext(LiffContext);
}

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getBrowserToken, setAuthToken, logoutExpiredSession } from "@/lib/auth-token";
import { isTokenExpired } from "@/lib/jwt";

export default function TokenSynchronizer() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.backendAccessToken) {
      if (isTokenExpired(session.backendAccessToken)) {
        void logoutExpiredSession();
        return;
      }

      const currentToken = getBrowserToken();
      if (currentToken !== session.backendAccessToken) {
        setAuthToken(session.backendAccessToken);
        
        // Synced username representation
        const name = session.user?.name || session.user?.email || "google-user";
        localStorage.setItem("username", name);
        
        // Dispatch event to notify layout/header components
        window.dispatchEvent(new Event("token-synced"));
      }
    }
  }, [session]);


  return null;
}

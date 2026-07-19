import { useState, useCallback, useEffect } from "react";
import { api } from "@/api/client";

const STORAGE_KEY = "real_door_session";

export function useSession() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(STORAGE_KEY)
  );
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.createSession();
      sessionStorage.setItem(STORAGE_KEY, data.session_token);
      setToken(data.session_token);
      return data.session_token;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInfo = useCallback(async () => {
    if (!token) return;
    try {
      const info = await api.getSessionInfo(token);
      setSessionInfo(info);
    } catch {
      setToken(null);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  const deleteSession = useCallback(async () => {
    await api.deleteSession(token);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("real_door_deleted", "true");
    setToken(null);
    setSessionInfo(null);
  }, [token]);

  useEffect(() => {
    if (token) refreshInfo();
  }, [token, refreshInfo]);

  return { token, sessionInfo, loading, createSession, refreshInfo, deleteSession };
}

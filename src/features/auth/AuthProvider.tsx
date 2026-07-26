import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getErrorMessage } from "../../lib/errors";

export interface LocalSession {
  userId: string;
}

interface AuthContextValue {
  session: LocalSession | null;
  isLoading: boolean;
  error: string | null;
  begin: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/session")
      .then(async (response) => {
        if (!response.ok) throw new Error("读取设备身份失败");
        return response.json() as Promise<{ userId: string | null }>;
      })
      .then((data) => setSession(data.userId ? { userId: data.userId } : null))
      .catch((sessionError) => setError(getErrorMessage(sessionError, "本地服务未启动，请先运行 pnpm dev")))
      .finally(() => setIsLoading(false));
  }, []);

  async function begin() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/session?create=1");
      const data = (await response.json()) as { userId?: string; error?: string };
      if (!response.ok || !data.userId) throw new Error(data.error || "创建设备身份失败");
      setSession({ userId: data.userId });
    } catch (beginError) {
      setError(getErrorMessage(beginError, "创建设备身份失败，请重试"));
    } finally {
      setIsLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      session,
      isLoading,
      error,
      begin,
      clearError: () => setError(null),
    }),
    [session, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "./lib/api";

export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!path) return;
    let active = true;
    setLoading(true);
    apiRequest<T>(path).then((value) => { if (active) setData(value); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason : new Error("読み込みに失敗しました")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision, ...deps]);
  return { data, loading, error, reload };
}

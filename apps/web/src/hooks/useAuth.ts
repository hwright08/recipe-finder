import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticate, fetchCurrentUser, logout } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { AuthPayload } from "../types";

const authStorageKey = "recipe-finder-auth-token";

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem(authStorageKey) ?? "");
  const sessionQuery = useQuery({
    queryKey: queryKeys.session(token),
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    retry: false
  });

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(authStorageKey);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.removeQueries({ queryKey: ["recipes"] });
      queryClient.removeQueries({ queryKey: ["kitchen"] });
      return;
    }

    localStorage.setItem(authStorageKey, token);
  }, [queryClient, token]);

  useEffect(() => {
    if (token && sessionQuery.isError) {
      setToken("");
    }
  }, [sessionQuery.isError, token]);

  const authMutation = useMutation({
    mutationFn: (input: { mode: "login" | "register"; payload: AuthPayload }) =>
      authenticate(input.mode, input.payload),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.session(data.token), { user: data.user });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen"] });
    }
  });
  const logoutMutation = useMutation({
    mutationFn: () => logout(token),
    onSettled: () => {
      setToken("");
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.removeQueries({ queryKey: ["recipes"] });
      queryClient.removeQueries({ queryKey: ["kitchen"] });
    }
  });

  return {
    authMutation,
    isCheckingSession: Boolean(token && sessionQuery.isPending),
    logoutMutation,
    token,
    user: sessionQuery.data?.user ?? null
  };
}

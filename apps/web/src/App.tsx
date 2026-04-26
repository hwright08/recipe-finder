import { createContext, useContext } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { theme } from "./theme";
import { AppLayout } from "./components/AppLayout";
import { KitchenPage } from "./pages/KitchenPage";
import { RecipesPage } from "./pages/RecipesPage";
import { useAuth } from "./hooks/useAuth";

type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function App() {
  const auth = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/recipes" replace />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="kitchen" element={<KitchenPage />} />
              <Route path="*" element={<Navigate to="/recipes" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export function useAuthContext() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuthContext must be used within AuthContext");
  }

  return auth;
}

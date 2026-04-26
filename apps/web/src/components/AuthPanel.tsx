import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useAuthContext } from "../App";

export function AuthPanel() {
  const { authMutation, isCheckingSession, logoutMutation, user } = useAuthContext();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? "")
    };

    await authMutation
      .mutateAsync({ mode: authMode, payload })
      .then(() => form.reset())
      .catch(() => {
        setAuthError(
          authMode === "login" ? "Invalid email or password." : "Unable to create account."
        );
      });
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      {user ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between"
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }}>{user.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Log out
          </Button>
        </Stack>
      ) : isCheckingSession ? (
        <Typography color="text.secondary">Checking session...</Typography>
      ) : (
        <Stack component="form" spacing={2} onSubmit={handleAuthSubmit}>
          <Tabs
            value={authMode}
            onChange={(_, value: "login" | "register") => setAuthMode(value)}
            aria-label="Auth mode"
          >
            <Tab label="Log in" value="login" />
            <Tab label="Register" value="register" />
          </Tabs>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: "flex-start" }}
          >
            <TextField
              key={`email-${authMode}`}
              name="email"
              type="email"
              label="Email"
              defaultValue=""
              required
              fullWidth
            />
            {authMode === "register" ? (
              <TextField name="displayName" label="Display name" required fullWidth />
            ) : null}
            <TextField
              key={`password-${authMode}`}
              name="password"
              type="password"
              label="Password"
              defaultValue=""
              slotProps={{ htmlInput: { minLength: 8 } }}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={authMutation.isPending}
              sx={{ minHeight: 56, px: 3 }}
            >
              {authMode === "login" ? "Log in" : "Create account"}
            </Button>
          </Stack>
          {authError ? <Alert severity="error">{authError}</Alert> : null}
        </Stack>
      )}
    </Paper>
  );
}

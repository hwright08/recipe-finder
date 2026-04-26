import { Avatar, Box, Container, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { ChefHat } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthPanel } from "./AuthPanel";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabValue = location.pathname.startsWith("/kitchen") ? "/kitchen" : "/recipes";

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, md: 4 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                bgcolor: "secondary.main",
                color: "common.white"
              }}
            >
              <ChefHat size={28} />
            </Avatar>
            <Box>
              <Typography variant="h1">Recipe Finder</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Collect recipes backed by Postgres and served through Nitro.
              </Typography>
            </Box>
          </Stack>

          <AuthPanel />

          <Paper variant="outlined">
            <Tabs
              value={tabValue}
              onChange={(_event, value: string) => navigate(value)}
              aria-label="Recipe Finder sections"
            >
              <Tab label="Recipes" value="/recipes" />
              <Tab label="Kitchen" value="/kitchen" />
            </Tabs>
          </Paper>

          <Outlet />
        </Stack>
      </Container>
    </Box>
  );
}

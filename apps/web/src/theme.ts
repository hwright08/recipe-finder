import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    background: {
      default: "#f6f5f1",
      paper: "#fff"
    },
    primary: {
      main: "#1e4f8f"
    },
    secondary: {
      main: "#2f6f4e"
    },
    warning: {
      main: "#d0833f"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: "clamp(2rem, 6vw, 4rem)",
      fontWeight: 800,
      lineHeight: 1
    }
  }
});

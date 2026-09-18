import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6750a4", dark: "#4f378b", light: "#eaddff", contrastText: "#ffffff" },
    secondary: { main: "#625b71", light: "#e8def8" },
    error: { main: "#ba1a1a", light: "#ffdad6" },
    background: { default: "#fef7ff", paper: "#fffbfe" },
    text: { primary: "#1d1b20", secondary: "#49454f" },
    divider: "#cac4d0",
  },
  typography: {
    fontFamily: 'Roboto, "Noto Sans JP", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
    button: { fontWeight: 700, textTransform: "none", letterSpacing: "0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 700 },
    overline: { fontWeight: 700, letterSpacing: "0.14em" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320 },
        "::selection": { backgroundColor: "#eaddff", color: "#21005d" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minWidth: 0, minHeight: 40, borderRadius: 999, paddingInline: 20 } },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: "#fffbfe" } } },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { minWidth: 64, borderRadius: 16 },
        label: { fontSize: "0.7rem", fontWeight: 700 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 999 }, bar: { borderRadius: 999 } },
    },
  },
});

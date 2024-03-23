import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { config } from "../firebase";
import Loader from "../components/statics/loader";
import { fetchAndActivate, getValue } from "firebase/remote-config";
// import {
//   ColorPaletteProp,
//   Snackbar,
//   SnackbarPropsColorOverrides,
//   Typography
// } from "@mui/joy";
// import { OverridableStringUnion } from "@mui/types";
import { AlertContext, ColorModeContext } from "../components/utils/context";
import NiceModal from "@ebay/nice-modal-react";
import {
  CssBaseline,
  GlobalStyles,
  Snackbar,
  ThemeProvider,
  Typography
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { APIProvider } from "@vis.gl/react-google-maps";
const MaintenanceMode = lazy(() => import("../components/statics/maintenance"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));
const FrontPage = lazy(() => import("./frontpage"));

const Territory = lazy(() => import("./territory/index"));
const SignUp = lazy(() => import("./signup"));
const ResetPassword = lazy(() => import("./resetpassword"));

function Main() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [snackbarAlert, setSnackbarAlert] = useState({
    open: false,
    color: "neutral",
    message: ""
  });
  const [mode, setMode] = useState<"light" | "dark">("light");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      }
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode
        }
      }),
    [mode]
  );

  const fetchAndActivateRemoteConfig = async () => {
    try {
      await fetchAndActivate(config);
      const maintenanceModeKey = import.meta.env
        .VITE_FIREBASE_MAINTENANCE_MODE_KEY;
      const isMaintenanceMode = getValue(
        config,
        maintenanceModeKey
      ).asBoolean();
      setIsMaintenance(isMaintenanceMode);
    } catch (error) {
      console.error("Error fetching and activating remote config:", error);
    }
  };

  useEffect(() => {
    fetchAndActivateRemoteConfig();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ColorModeContext.Provider value={colorMode}>
        <CssBaseline />
        <GlobalStyles
          styles={(theme) => ({
            ":root": {
              "--Header-height": "62px",
              "--Sidebar-width": "320px",
              "--SideNavigation-slideIn": "600px",
              [theme.breakpoints.up("lg")]: {
                "--Sidebar-width": "240px"
              }
            }
          })}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AlertContext.Provider value={{ snackbarAlert, setSnackbarAlert }}>
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
              <NiceModal.Provider>
                <Suspense fallback={<Loader />}>
                  <Routes>
                    <Route path="*" element={<NotFoundPage />} />
                    <Route path="" element={<FrontPage />} />
                    <Route path="signin" element={<SignUp />} />
                    <Route path="reset" element={<ResetPassword />} />
                    <Route path="map/:id" element={<Territory />} />
                  </Routes>
                  <Typography
                    sx={{
                      position: "fixed",
                      bottom: 0,
                      right: 0,
                      color: "text.secondary",
                      fontSize: "0.8rem",
                      padding: "0.5rem",
                      opacity: 0.5
                    }}
                  >
                    {import.meta.env.VITE_ROLLBAR_ENVIRONMENT !== "production"
                      ? `${import.meta.env.VITE_ROLLBAR_ENVIRONMENT} - v${
                          import.meta.env.VITE_VERSION
                        }`
                      : `v${import.meta.env.VITE_VERSION}`}
                  </Typography>
                  {isMaintenance && <MaintenanceMode />}
                  <Snackbar
                    autoHideDuration={3000}
                    open={snackbarAlert.open}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "center"
                    }}
                    color={snackbarAlert.color}
                    message={snackbarAlert.message}
                    onClose={() =>
                      setSnackbarAlert((prev) => ({ ...prev, open: false }))
                    }
                  />
                </Suspense>
              </NiceModal.Provider>
            </APIProvider>
          </AlertContext.Provider>
        </LocalizationProvider>
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}

export default Main;

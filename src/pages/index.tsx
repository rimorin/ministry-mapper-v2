import { useState, useEffect, lazy, Suspense } from "react";
// import { Container } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import { config } from "../firebase";
import Loader from "../components/statics/loader";
import { fetchAndActivate, getValue } from "firebase/remote-config";
import {
  Box,
  ColorPaletteProp,
  Snackbar,
  SnackbarPropsColorOverrides
} from "@mui/joy";
import { OverridableStringUnion } from "@mui/types";
import { AlertContext } from "../components/utils/context";
const waitFunction = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const MaintenanceMode = lazy(() => import("../components/statics/maintenance"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));
const FrontPage = lazy(() =>
  waitFunction(1000).then(() => import("./frontpage"))
);
const Territory = lazy(() => import("./territory/index"));
const SignUp = lazy(() => import("./signup"));
const ResetPassword = lazy(() => import("./resetpassword"));

function Main() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [snackbarAlert, setSnackbarAlert] = useState({
    open: false,
    color: "neutral" as OverridableStringUnion<
      ColorPaletteProp,
      SnackbarPropsColorOverrides
    >,
    message: ""
  });

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
    <AlertContext.Provider value={{ snackbarAlert, setSnackbarAlert }}>
      <Box>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
            <Route path="" element={<FrontPage />} />
            <Route path="signin" element={<SignUp />} />
            <Route path="reset" element={<ResetPassword />} />
            <Route path="map/:id" element={<Territory />} />
          </Routes>
          <div className="fixed-bottom text-muted opacity-25 m-2">
            <>v{import.meta.env.VITE_VERSION}</>
          </div>
          {isMaintenance && <MaintenanceMode />}
          <Snackbar
            autoHideDuration={3000}
            open={snackbarAlert.open}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center"
            }}
            color={snackbarAlert.color}
            onClose={() =>
              setSnackbarAlert((prev) => ({ ...prev, open: false }))
            }
          >
            {snackbarAlert.message}
          </Snackbar>
        </Suspense>
      </Box>
    </AlertContext.Provider>
  );
}

export default Main;

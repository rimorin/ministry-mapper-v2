// import { useColorScheme } from "@mui/joy/styles";
// import IconButton, { IconButtonProps } from "@mui/joy/IconButton";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, IconButtonProps, useTheme } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext } from "./utils/context";

export default function ColorSchemeToggle(props: IconButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onClick, sx, ...other } = props;
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <IconButton
        size="small"
        // variant="outlined"
        // color="default"
        {...other}
        sx={sx}
        disabled
      />
    );
  }
  return (
    <IconButton
      sx={{ ml: 1 }}
      onClick={colorMode.toggleColorMode}
      color="inherit"
    >
      {theme.palette.mode === "dark" ? (
        <DarkModeRoundedIcon />
      ) : (
        <LightModeIcon />
      )}
    </IconButton>
    // <IconButton
    //   id="toggle-mode"
    //   size="small"
    //   // variant="outlined"
    //   // color="neutral"
    //   {...other}
    //   onClick={(event) => {
    //     if (mode === "light") {
    //       setMode("dark");
    //     } else {
    //       setMode("light");
    //     }
    //     colorMode.toggleColorMode();
    //     onClick?.(event);
    //   }}
    //   sx={[
    //     {
    //       "& > *:first-of-type": {
    //         display: mode === "dark" ? "none" : "initial"
    //       },
    //       "& > *:last-child": {
    //         display: mode === "light" ? "none" : "initial"
    //       }
    //     },
    //     ...(Array.isArray(sx) ? sx : [sx])
    //   ]}
    // >
    //   <DarkModeRoundedIcon />
    //   <LightModeIcon />
    // </IconButton>
  );
}

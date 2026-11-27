import { cn } from "@/lib/utils";
import logo from "../../../brand/logo.svg";

interface AppLogoProps {
  className?: string;
  // Names the logo for screen readers; without one it is decorative.
  label?: string;
}

// The master logo with no tile: its colours hold up on light and dark alike.
// It is built into the bundle, so it shows offline.
const AppLogo = ({ className, label }: AppLogoProps) => (
  <img
    src={logo}
    alt={label ?? ""}
    draggable={false}
    className={cn("aspect-square shrink-0", className)}
  />
);

export default AppLogo;

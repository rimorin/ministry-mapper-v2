import { cn } from "@/lib/utils";
import logo from "../../../brand/logo.svg";

interface AppLogoProps {
  className?: string;
  // Names the logo for screen readers; without one it is decorative.
  label?: string;
}

// The master logo on its tile. The tile takes the app's own theme rather than
// the device's; the art is built into the bundle, so it shows offline.
const AppLogo = ({ className, label }: AppLogoProps) => (
  <span
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn(
      "inline-grid aspect-square shrink-0 place-items-center rounded-[22%] bg-(--logo-tile)",
      className
    )}
  >
    <img src={logo} alt="" draggable={false} className="size-[90%]" />
  </span>
);

export default AppLogo;

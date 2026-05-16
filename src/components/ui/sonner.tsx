import { use } from "react";
import { createPortal } from "react-dom";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { ThemeContext } from "@/components/utils/context";

function Toaster({ ...props }: ToasterProps) {
  const { theme } = use(ThemeContext);
  return createPortal(
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      position="bottom-right"
      closeButton
      {...props}
    />,
    document.body
  );
}

export { Toaster };

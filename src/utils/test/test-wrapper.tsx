import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import NiceModal from "@ebay/nice-modal-react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { ToastProvider } from "../../components/middlewares/toast";
import ThemeMiddleware from "../../components/middlewares/theme";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeMiddleware>
        <ToastProvider>
          <NiceModal.Provider>{children}</NiceModal.Provider>
        </ToastProvider>
      </ThemeMiddleware>
    </I18nextProvider>
  );
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";

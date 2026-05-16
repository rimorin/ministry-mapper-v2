import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import NiceModal from "@ebay/nice-modal-react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import ThemeMiddleware from "../../components/middlewares/theme";

if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  locale?: string;
}

interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeMiddleware>
        <NiceModal.Provider>{children}</NiceModal.Provider>
      </ThemeMiddleware>
    </I18nextProvider>
  );
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { locale, ...renderOptions } = options ?? {};

  if (locale) {
    void i18n.changeLanguage(locale);
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";

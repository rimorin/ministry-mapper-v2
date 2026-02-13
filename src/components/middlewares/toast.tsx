import { createContext, use, useState, ReactNode } from "react";
import { ToastContainer as BSToastContainer, Toast } from "react-bootstrap";

export type ToastVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string | ReactNode;
  variant: ToastVariant;
  autohide?: boolean;
  delay?: number;
  show?: boolean;
}

interface ToastContextType {
  showToast: (
    message: string | ReactNode,
    variant?: ToastVariant,
    title?: string,
    options?: Partial<ToastMessage>
  ) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ANIMATION_DURATION = 300;
const SHOW_DELAY = 100;
const DEFAULT_DELAY = 3000;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = use(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, show: false } : toast))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, ANIMATION_DURATION);
  };

  const showToast = (
    message: string | ReactNode,
    variant: ToastVariant = "info",
    title?: string,
    options?: Partial<ToastMessage>
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      message,
      variant,
      title,
      autohide: true,
      delay: DEFAULT_DELAY,
      show: false,
      ...options
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, show: true } : toast
        )
      );
    }, SHOW_DELAY);
  };

  const success = (message: string, title = "Success") =>
    showToast(message, "success", title);

  const error = (message: string, title = "Error") =>
    showToast(message, "danger", title, { autohide: false });

  const warning = (message: string, title = "Warning") =>
    showToast(message, "warning", title);

  const info = (message: string, title?: string) =>
    showToast(message, "info", title);

  const contextValue = {
    showToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <BSToastContainer
        position="bottom-end"
        className="p-3"
        style={{ position: "fixed", zIndex: 9999 }}
      >
        {toasts.map((toast) => {
          const isLightText =
            toast.variant === "dark" || toast.variant === "danger";

          return (
            <Toast
              key={toast.id}
              onClose={() => removeToast(toast.id)}
              show={toast.show}
              autohide={toast.autohide}
              delay={toast.delay}
              bg={toast.variant}
            >
              <Toast.Header closeButton>
                <strong className="me-auto">
                  {toast.title || "Notification"}
                </strong>
              </Toast.Header>
              <Toast.Body className={isLightText ? "text-white" : ""}>
                {toast.message}
              </Toast.Body>
            </Toast>
          );
        })}
      </BSToastContainer>
    </ToastContext.Provider>
  );
};

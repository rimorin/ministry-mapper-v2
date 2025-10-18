import { FC, ReactNode } from "react";
import { Form } from "react-bootstrap";

interface AuthContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: "primary" | "secondary" | "success" | "danger";
  noValidate?: boolean;
  validated?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthContainer: FC<AuthContainerProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconColor = "primary",
  noValidate = true,
  validated = false,
  onSubmit
}) => (
  <Form
    noValidate={noValidate}
    validated={validated}
    onSubmit={onSubmit}
    className="responsive-width py-3"
  >
    <Form.Group className="mb-3 text-center">
      {icon && (
        <div className="mb-3">
          <div
            className={`icon-large icon-${iconColor}`}
            role="img"
            aria-label={title}
          >
            {icon}
          </div>
        </div>
      )}
      <h1 className="h3 mb-2">{title}</h1>
      {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
    </Form.Group>
    {children}
  </Form>
);

export default AuthContainer;

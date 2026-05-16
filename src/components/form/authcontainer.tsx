import { FC, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface AuthContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconPlain?: boolean;
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
  iconPlain = false,
  noValidate = true,
  validated = false,
  onSubmit
}) => (
  <Card className="w-full shadow-md">
    <CardHeader className="text-center pb-2">
      {icon && (
        <div
          className={
            iconPlain
              ? "mx-auto mb-2 flex size-12 items-center justify-center"
              : "mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-2xl"
          }
        >
          {icon}
        </div>
      )}
      <CardTitle className="text-2xl font-semibold tracking-tight">
        {title}
      </CardTitle>
      {subtitle && (
        <CardDescription className="mt-1 text-sm">{subtitle}</CardDescription>
      )}
    </CardHeader>
    <CardContent>
      <form
        noValidate={noValidate}
        data-validated={validated}
        onSubmit={onSubmit}
        className="space-y-4"
      >
        {children}
      </form>
    </CardContent>
  </Card>
);

export default AuthContainer;

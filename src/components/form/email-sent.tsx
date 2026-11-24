import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import AuthContainer from "./authcontainer";

interface EmailSentProps {
  // What was sent and to whom.
  message: string;
  // The ways on from here.
  children: ReactNode;
}

// What a form turns into once it has sent an email: the person's next step is
// in their inbox, and a passing notice is too easy to miss.
const EmailSent = ({ message, children }: EmailSentProps) => {
  const { t } = useTranslation();
  return (
    <AuthContainer
      title={t("auth.checkEmailTitle", "Check your email")}
      subtitle={message}
      icon={<Mail className="size-6" aria-hidden="true" />}
    >
      <FieldGroup className="gap-5">
        <FieldDescription className="text-center">
          {t("auth.checkSpam", "Check your spam folder if you don't see it.")}
        </FieldDescription>
        {children}
      </FieldGroup>
    </AuthContainer>
  );
};

export default EmailSent;

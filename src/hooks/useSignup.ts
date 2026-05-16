import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createData, verifyEmail } from "../utils/pocketbase";
import useNotification from "./useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "./useAnalytics";
import { mapPbAuthError } from "../utils/helpers/pbErrors";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export default function useSignup() {
  const { t } = useTranslation();
  const { notifyError, notifyWarning, runAction } = useNotification();
  const { trackEvent } = useAnalytics();
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [validated, setValidated] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleCreateSubmit = async (onSuccess?: () => void) => {
    await runAction(
      async () => {
        await createData(
          "users",
          {
            email: formData.email,
            name: formData.name,
            password: formData.password,
            passwordConfirm: formData.confirmPassword
          },
          {
            requestKey: `user-signup-${formData.email}`
          }
        );
        await verifyEmail(formData.email);
        trackEvent(ANALYTICS_EVENTS.SIGNUP);
        notifyWarning(
          "Account created! Please check your email for verification procedures."
        );
        onSuccess?.();
      },
      {
        setLoading: setIsCreating,
        onError: (err) => {
          setValidated(false);
          notifyError(mapPbAuthError(err, t) ?? err);
        }
      }
    );
  };

  const resetCreationForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    });
    setValidated(false);
  };

  return {
    formData,
    validated,
    setValidated,
    isPasswordValid,
    setIsPasswordValid,
    isCreating,
    handleInputChange,
    handleCreateSubmit,
    resetCreationForm
  };
}

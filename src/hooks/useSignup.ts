import { useState } from "react";
import { createData, verifyEmail } from "../utils/pocketbase";
import useNotification from "./useNotification";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export default function useSignup() {
  const { notifyError, notifyWarning } = useNotification();
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
    setIsCreating(true);
    try {
      await createData(
        "users",
        {
          email: formData.email,
          name: formData.name,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          emailVisibility: true
        },
        {
          requestKey: `user-signup-${formData.email}`
        }
      );
      await verifyEmail(formData.email);
      notifyWarning(
        "Account created! Please check your email for verification procedures."
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setValidated(false);
      notifyError(err);
    } finally {
      setIsCreating(false);
    }
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

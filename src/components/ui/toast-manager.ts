import { Toast } from "@base-ui/react/toast";

// Kept apart from toast.tsx so callers that only fire toasts (useNotification,
// the SW update prompt) don't pull the Toaster UI and its Base UI subtree onto
// the initial load; the Toaster itself is lazy-mounted in pages/index.tsx.
export const toast = Toast.createToastManager();

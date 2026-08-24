import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  pending: boolean;
}

// Every modal footer submits the same way: disable while the write is in
// flight and show a leading spinner. Keeping it here means the spinner's
// data-icon and aria-hidden cannot drift between them.
const SubmitButton = ({ pending, children, ...props }: SubmitButtonProps) => (
  <Button {...props} type="submit" disabled={pending}>
    {pending && <Spinner data-icon="inline-start" aria-hidden="true" />}
    {children}
  </Button>
);

export default SubmitButton;

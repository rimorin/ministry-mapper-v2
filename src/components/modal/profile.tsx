import NiceModal from "@ebay/nice-modal-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import useNotification from "../../hooks/useNotification";
import { UpdateProfileModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const GetProfile = NiceModal.create(({ user }: UpdateProfileModalProps) => {
  const { t } = useTranslation();
  const { notifySuccess, runAction } = useNotification();
  const form = useForm<{ name: string }>({
    values: { name: user?.name ?? "" }
  });
  const { modal, dialogProps, contentProps } = useBaseUiDialog({
    onClose: () => form.reset()
  });

  const onSubmit = async (values: { name: string }) => {
    await runAction(async () => {
      await updateDataById(
        "users",
        user?.id as string,
        { name: values.name },
        { requestKey: `update-name-${user?.id}` }
      );
      notifySuccess(t("profile.updateSuccess"));
      modal.hide();
    });
  };

  return (
    <Dialog {...dialogProps}>
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>{t("profile.title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.emailAddress")}</Label>
              <Input
                id="email"
                readOnly
                disabled
                defaultValue={user?.email ?? ""}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  form.reset();
                  modal.hide();
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("profile.updateButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default GetProfile;

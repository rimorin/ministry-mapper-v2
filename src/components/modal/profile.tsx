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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SubmitButton from "../common/submit-button";
import useNotification from "../../hooks/useNotification";
import { UpdateProfileModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const GetProfile = NiceModal.create(({ user }: UpdateProfileModalProps) => {
  const { t } = useTranslation();
  const { notifySuccess, runAction } = useNotification();
  const form = useForm<{ name: string; emailOnAssignment: boolean }>({
    values: {
      name: user?.name ?? "",
      emailOnAssignment: !!user?.assignment_emails
    }
  });
  const { modal, dialogProps, contentProps } = useBaseUiDialog({
    onClose: () => form.reset()
  });

  const onSubmit = async (values: {
    name: string;
    emailOnAssignment: boolean;
  }) => {
    await runAction(async () => {
      await updateDataById(
        "users",
        user?.id as string,
        {
          name: values.name,
          assignment_emails: values.emailOnAssignment
        },
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
            <FormField
              control={form.control}
              name="emailOnAssignment"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3">
                  <FormLabel className="font-normal">
                    {t(
                      "profile.emailOnAssignment",
                      "Email me when I am given a map"
                    )}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              <SubmitButton pending={form.formState.isSubmitting}>
                {t("profile.updateButton")}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default GetProfile;

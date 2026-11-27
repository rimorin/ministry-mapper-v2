import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import SubmitButton from "../common/submit-button";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useConfirm from "../../hooks/useConfirm";
import useNotification from "../../hooks/useNotification";
import { UserModalProps } from "../../utils/interface";
import UserRoleField from "../form/role";
import { deleteDataById, updateDataById } from "../../utils/pocketbase";

const UpdateUser = NiceModal.create(
  ({ uid, name, role = USER_ACCESS_LEVELS.NO_ACCESS.CODE }: UserModalProps) => {
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const { confirm } = useConfirm();
    const form = useForm<{ role: string }>({
      values: { role }
    });
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      onClose: () => form.reset()
    });

    const handleUserDetails = async (values: { role: string }) => {
      await runAction(async () => {
        await updateDataById(
          "roles",
          uid,
          { role: values.role },
          { requestKey: `update-usr-role-${uid}` }
        );
        modal.resolve(values.role);
        modal.hide();
      });
    };

    // Resolves with No Access, which the list takes as gone.
    const handleRemove = async () => {
      const confirmed = await confirm({
        title: t("user.removeTitle", "Remove {{name}}?", { name }),
        message: t(
          "user.removeMessage",
          "They lose access to this congregation and come off its maps and groups."
        ),
        confirmText: t("common.remove", "Remove")
      });
      if (!confirmed) return;
      await runAction(async () => {
        await deleteDataById("roles", uid, {
          requestKey: `delete-usr-role-${uid}`
        });
        modal.resolve(USER_ACCESS_LEVELS.NO_ACCESS.CODE);
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>
              {t(
                "user.updateRoleDescription",
                "Choose this member's access level."
              )}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUserDetails)}
              className="space-y-4"
            >
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>{t("user.accessLevel", "Access Level")}</Label>
                    <UserRoleField
                      role={field.value}
                      handleRoleChange={field.onChange}
                    />
                  </div>
                )}
              />
              <Separator />
              <DialogFooter>
                <Button
                  variant="destructive"
                  type="button"
                  className="sm:mr-auto"
                  onClick={handleRemove}
                >
                  {t("user.removeFromCongregation", "Remove from congregation")}
                </Button>
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
                  {t("common.save")}
                </SubmitButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateUser;

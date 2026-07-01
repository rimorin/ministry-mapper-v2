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
import { Spinner } from "@/components/ui/spinner";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UserModalProps } from "../../utils/interface";
import UserRoleField from "../form/role";
import ComponentAuthorizer from "../navigation/authorizer";
import { deleteDataById, updateDataById } from "../../utils/pocketbase";

const UpdateUser = NiceModal.create(
  ({
    uid,
    name,
    role = USER_ACCESS_LEVELS.NO_ACCESS.CODE,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const form = useForm<{ role: string }>({
      values: { role }
    });
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      onClose: () => form.reset()
    });

    const handleUserDetails = async (values: { role: string }) => {
      await runAction(async () => {
        if (values.role === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
          await deleteDataById("roles", uid, {
            requestKey: `delete-usr-role-${uid}`
          });
        } else {
          await updateDataById(
            "roles",
            uid,
            { role: values.role },
            {
              requestKey: `update-usr-role-${uid}`
            }
          );
        }
        modal.resolve(values.role);
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>{t("user.updateRole", { name })}</DialogTitle>
            <DialogDescription>
              {t(
                "user.updateRoleDescription",
                "Select the access level for this user."
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
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.reset();
                    modal.hide();
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <ComponentAuthorizer
                  requiredPermission={footerSaveAcl}
                  userPermission={footerSaveAcl}
                >
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                    )}
                    {t("common.save")}
                  </Button>
                </ComponentAuthorizer>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateUser;

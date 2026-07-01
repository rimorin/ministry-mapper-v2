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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import useNotification from "../../hooks/useNotification";
import ComponentAuthorizer from "../navigation/authorizer";
import { ChangeAddressNameModalProps } from "../../utils/interface";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { updateDataById } from "../../utils/pocketbase";

const ChangeAddressName = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId
  }: ChangeAddressNameModalProps) => {
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const form = useForm<{ name: string }>({
      values: { name }
    });
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      onClose: () => form.reset()
    });

    const onSubmit = async (values: { name: string }) => {
      await runAction(async () => {
        await updateDataById(
          "maps",
          mapId,
          { description: values.name },
          {
            requestKey: `update-map-desc-${mapId}`
          }
        );
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("address.changeName", "Change Address Name")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address.name", "Name")}</FormLabel>
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

export default ChangeAddressName;

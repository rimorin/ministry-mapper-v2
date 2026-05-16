import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import { ChangeTerritoryDetailsModalProps } from "../../utils/interface";
import ComponentAuthorizer from "../navigation/authorizer";
import { getFirstItemOfList, updateDataById } from "../../utils/pocketbase";

type FormValues = { name: string; code: string };

const ChangeTerritoryDetails = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    territoryId,
    name
  }: ChangeTerritoryDetailsModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const {
      modal,
      dialogProps: baseDialogProps,
      contentProps
    } = useBaseUiDialog();
    const form = useForm<FormValues>({
      values: { name: name ?? "", code: territoryCode }
    });

    const dialogProps = {
      ...baseDialogProps,
      onOpenChange: (open: boolean) => {
        if (!open) {
          form.reset();
        }
        baseDialogProps.onOpenChange(open);
      }
    };

    const onSubmit = async (values: FormValues) => {
      await runAction(async () => {
        if (
          await getFirstItemOfList(
            "territories",
            `code="${values.code}" && congregation="${congregation}" && id!="${territoryId}"`,
            {
              requestKey: `check-territory-${values.code}-${congregation}`,
              fields: "id"
            }
          )
        ) {
          notifyWarning(
            t("territory.codeAlreadyExists", "Territory code already exists.")
          );
          return;
        }
        await updateDataById(
          "territories",
          territoryId,
          { code: values.code, description: values.name },
          {
            requestKey: `update-territory-details-${territoryId}`
          }
        );
        modal.resolve({ code: values.code, name: values.name });
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("territory.changeDetails", "Change Details")}
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
                    <FormLabel>{t("common.name", "Name")}</FormLabel>
                    <FormControl>
                      <Input {...field} aria-required="true" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                rules={{
                  required: true,
                  validate: (v) =>
                    IsValidTerritoryCode(v) || "Invalid territory code format"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.code", "Code")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-required="true"
                        placeholder={t(
                          "territory.codeExample",
                          "Territory code. For eg, M01, W12, etc."
                        )}
                        onChange={(e) => {
                          const { value } = e.target;
                          if (value !== "" && !IsValidTerritoryCode(value)) {
                            return;
                          }
                          field.onChange(e);
                        }}
                      />
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
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
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

export default ChangeTerritoryDetails;

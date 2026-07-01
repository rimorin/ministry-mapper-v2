import NiceModal from "@ebay/nice-modal-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UpdateCongregationSettingsModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

type FormValues = { name: string; maxTries: number; defaultExpiryHrs: number };

const UpdateCongregationSettings = NiceModal.create(
  ({
    currentName,
    currentCongregation,
    currentMaxTries = DEFAULT_CONGREGATION_MAX_TRIES,
    currentDefaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS
  }: UpdateCongregationSettingsModalProps) => {
    const { t } = useTranslation();
    const { notifySuccess, runAction } = useNotification();
    const form = useForm<FormValues>({
      values: {
        name: currentName,
        maxTries: currentMaxTries,
        defaultExpiryHrs: currentDefaultExpiryHrs
      }
    });
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      onClose: () => form.reset()
    });

    const onSubmit = async (values: FormValues) => {
      await runAction(async () => {
        await updateDataById(
          "congregations",
          currentCongregation,
          {
            name: values.name,
            expiry_hours: values.defaultExpiryHrs,
            max_tries: values.maxTries
          },
          {
            requestKey: `congregations-details-${currentCongregation}`
          }
        );
        notifySuccess(
          t("congregation.settingsUpdated", "Congregation settings updated.")
        );
        modal.resolve({
          name: values.name,
          maxTries: values.maxTries,
          defaultExpiryHrs: values.defaultExpiryHrs
        });
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("congregation.settings", "Congregation Settings")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Congregation settings
            </DialogDescription>
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
                      <Input
                        {...field}
                        aria-required="true"
                        placeholder={t(
                          "congregation.enterName",
                          "Enter congregation name"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxTries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("congregation.numberOfTries", "No. of Tries")}
                    </FormLabel>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={1}
                        max={4}
                        step={1}
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val)}
                        className="flex-1"
                      />
                      <span className="w-8 text-center text-sm tabular-nums">
                        {field.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "congregation.triesDescription",
                        "The number of times to try not at homes before considering it done"
                      )}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultExpiryHrs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "congregation.defaultSlipExpiry",
                        "Default Slip Expiry Hours"
                      )}
                    </FormLabel>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={1}
                        max={24}
                        step={1}
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val)}
                        className="flex-1"
                      />
                      <span className="w-8 text-center text-sm tabular-nums">
                        {field.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "congregation.expiryDescription",
                        "The duration of the territory slip link before it expires"
                      )}
                    </p>
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
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateCongregationSettings;

import NiceModal from "@ebay/nice-modal-react";
import { lazy, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import {
  NewTerritoryCodeModalProps,
  TerritoryPolygonCoordinate
} from "../../utils/interface";
import { createData, getFirstItemOfList } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";
import ComponentAuthorizer from "../navigation/authorizer";

type FormValues = { code: string; name: string };

const ConfigureTerritoryCoordinates = lazy(
  () => import("./changeterritorycoordinates")
);

const NewTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    origin
  }: NewTerritoryCodeModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const { showModal } = useModalManagement();
    const [coordinates, setCoordinates] = useState<TerritoryPolygonCoordinate>(
      []
    );
    const {
      modal,
      dialogProps: baseDialogProps,
      contentProps
    } = useBaseUiDialog();
    const form = useForm<FormValues>({
      defaultValues: {
        code: "",
        name: ""
      }
    });

    const dialogProps = {
      ...baseDialogProps,
      onOpenChange: (open: boolean) => {
        if (!open) {
          form.reset();
          setCoordinates([]);
        }
        baseDialogProps.onOpenChange(open);
      }
    };

    const handleLocationSelect = async () => {
      const result = await showModal(ConfigureTerritoryCoordinates, {
        coordinates,
        origin,
        isSelectOnly: true
      });
      const newCoordinates = result as TerritoryPolygonCoordinate;
      if (newCoordinates && newCoordinates.length >= 3) {
        setCoordinates(newCoordinates);
      }
    };

    const handleCreateTerritory = async (values: FormValues) => {
      await runAction(async () => {
        if (
          await getFirstItemOfList(
            "territories",
            `code="${values.code}" && congregation="${congregation}"`,
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
        await createData(
          "territories",
          {
            code: values.code,
            description: values.name,
            congregation,
            coordinates: coordinates.length >= 3 ? coordinates : undefined
          },
          {
            requestKey: `create-territory-${congregation}-${values.code}`
          }
        );
        notifyWarning(
          t("territory.createdSuccess", "Created territory, {{name}}.", {
            name: values.name
          })
        );
        modal.hide();
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("territory.createNew", "Create New Territory")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateTerritory)}
              className="space-y-4"
            >
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
                    <FormLabel>
                      {t("territory.territoryCode", "Territory Code")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-required="true"
                        placeholder={t(
                          "territory.codeExample",
                          "Territory code. For eg, M01, W12, etc."
                        )}
                        autoComplete="off"
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
                          "territory.nameExample",
                          "Name of the territory. For eg, 801-810, Woodlands Drive."
                        )}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="boundary">
                  {t("territory.location", "Territory Boundary (Optional)")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="boundary"
                    type="text"
                    name="boundary"
                    placeholder={
                      coordinates.length >= 3
                        ? t(
                            "territory.locationSet",
                            "Boundary Set ({{count}} points)",
                            {
                              count: coordinates.length
                            }
                          )
                        : t(
                            "territory.clickToSetBoundary",
                            "Click to set boundary"
                          )
                    }
                    value={
                      coordinates.length >= 3
                        ? t(
                            "territory.locationSet",
                            "Boundary Set ({{count}} points)",
                            {
                              count: coordinates.length
                            }
                          )
                        : ""
                    }
                    onClick={handleLocationSelect}
                    onChange={() => {}}
                    readOnly
                    autoComplete="off"
                    className="cursor-pointer"
                  />
                  {coordinates.length >= 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCoordinates([])}
                      aria-label="Clear boundary"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "territory.locationHelp",
                    "Draw a polygon to define the geographic boundary of this territory"
                  )}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.reset();
                    setCoordinates([]);
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

export default NewTerritoryCode;

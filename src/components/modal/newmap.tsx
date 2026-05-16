import NiceModal from "@ebay/nice-modal-react";
import { useState, FormEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Info, Layers, Home } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  MIN_START_FLOOR
} from "../../utils/constants";
import isValidMapSequence from "../../utils/helpers/checkvalidseq";
import useNotification from "../../hooks/useNotification";
import type {
  NewPrivateAddressModalProps,
  latlongInterface
} from "../../utils/interface";
import FloorField from "../form/floors";
import GenericInputField from "../form/input";
import TagField from "../form/tagfield";
import ChangeMapGeolocation from "./changegeolocation";
import { callFunction } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";
import ComponentAuthorizer from "../navigation/authorizer";

const NewMap = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPrivateAddressModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      size: "lg"
    });
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const { showModal } = useModalManagement();
    const [name, setName] = useState("");
    const [coordinates, setCoordinates] = useState<
      latlongInterface | undefined
    >();
    const [sequenceTags, setSequenceTags] = useState<string[]>([]);
    const [mapType, setMapType] = useState(TERRITORY_TYPES.MULTIPLE_STORIES);
    const [floors, setFloors] = useState(MIN_START_FLOOR);
    const [isSaving, setIsSaving] = useState(false);

    const isMultiStory = mapType === TERRITORY_TYPES.MULTIPLE_STORIES;

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      const sequence = sequenceTags.join(",");

      if (!isValidMapSequence(sequence)) {
        notifyWarning(t("map.invalidSequence"));
        return;
      }

      if (!coordinates) {
        notifyWarning(t("map.selectLocation", "Please select a location"));
        return;
      }

      await runAction(
        async () => {
          await callFunction("/map/add", {
            method: "POST",
            body: {
              name,
              sequence,
              type: mapType,
              coordinates: JSON.stringify(coordinates),
              congregation,
              territory: territoryCode,
              floors: isMultiStory ? floors : MIN_START_FLOOR
            }
          });
          modal.resolve();
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const handleLocationSelect = async () => {
      const result = await showModal(ChangeMapGeolocation, {
        coordinates,
        origin,
        isSelectOnly: true
      });
      const newCoordinates = result as latlongInterface;
      if (newCoordinates) {
        setCoordinates(newCoordinates);
      }
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(contentProps.className, "h-[75dvh] flex flex-col")}
        >
          <DialogHeader>
            <DialogTitle>{t("map.createMap")}</DialogTitle>
            <DialogDescription>
              {t(
                "map.createMapDescription",
                "Configure and add a new map to this territory."
              )}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <form
            onSubmit={handleCreateTerritoryAddress}
            className="flex flex-col flex-1 min-h-0 gap-5"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="flex flex-col gap-5 px-1 py-1">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t("map.mapType")}</p>
                  <ToggleGroup
                    variant="outline"
                    value={[mapType]}
                    onValueChange={(vals) => {
                      if (vals.length > 0) setMapType(vals[vals.length - 1]);
                    }}
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value={TERRITORY_TYPES.MULTIPLE_STORIES}
                      className="flex-1 gap-2"
                    >
                      <Layers className="size-4" />
                      {t("map.multiStory")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value={TERRITORY_TYPES.SINGLE_STORY}
                      className="flex-1 gap-2"
                    >
                      <Home className="size-4" />
                      {t("map.singleStory")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Alert>
                    <Info className="size-4" />
                    <AlertDescription className="text-xs">
                      {isMultiStory
                        ? t("map.multiStoryDescription")
                        : t("map.singleStoryDescription")}
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <GenericInputField
                    label={t("map.mapName")}
                    name="name"
                    handleChange={(e: ChangeEvent<HTMLElement>) =>
                      setName((e.target as HTMLInputElement).value)
                    }
                    changeValue={name}
                    required={true}
                    information={t("map.descriptionInfo")}
                    autoComplete="off"
                  />
                  <GenericInputField
                    label={t("map.mapCoordinates")}
                    name="location"
                    placeholder={t("map.clickToSelectLocation")}
                    handleClick={handleLocationSelect}
                    changeValue={
                      coordinates
                        ? `${coordinates.lat}, ${coordinates.lng}`
                        : ""
                    }
                    required={true}
                    information={t("map.coordinatesInfo")}
                    readOnly={true}
                    autoComplete="off"
                  />
                </div>

                <Separator />

                <TagField
                  label={t("map.sequence")}
                  value={sequenceTags}
                  onChange={setSequenceTags}
                  placeholder={t("map.sequencePlaceholder")}
                  noOptionsMessage={t("map.sequenceNoOptions")}
                  formatCreateLabel={(inputValue) =>
                    t("map.sequenceAdd", { value: inputValue })
                  }
                  helpText={t("map.sequenceHelpText")}
                />

                {isMultiStory && (
                  <>
                    <Separator />
                    <FloorField
                      handleChange={(e: ChangeEvent<HTMLElement>) =>
                        setFloors(Number((e.target as HTMLInputElement).value))
                      }
                      changeValue={floors}
                    />
                  </>
                )}
              </div>
            </ScrollArea>
            <Separator />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={footerSaveAcl}
                userPermission={footerSaveAcl}
              >
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t("common.create")}
                </Button>
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default NewMap;

import { useTranslation } from "react-i18next";
import { Crosshair, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import useGeolocation from "../../hooks/useGeolocation";
import useNotification from "../../hooks/useNotification";
import type { AddressCoordinatesFieldProps } from "../../utils/interface";

// 6 decimal places is ~0.1m — finer than any device fix.
const COORDINATE_PRECISION = 6;

// Fresh fixes (maximumAge: 0) often need longer than the shared 5s default.
// Module scope: requestLocation memoises on this object's identity.
const CAPTURE_OPTIONS = { timeout: 15000 };

const AddressCoordinatesField = ({
  coordinates,
  onChange,
  onSelectOnMap
}: AddressCoordinatesFieldProps) => {
  const { t } = useTranslation();
  const { notifyWarning } = useNotification();
  const { requestLocation, isLoadingLocation } = useGeolocation({
    skipGeolocation: true,
    watchOptions: CAPTURE_OPTIONS
  });

  const handleUseMyLocation = async () => {
    const location = await requestLocation();
    if (!location) {
      notifyWarning(
        t(
          "errors.unableToGetLocation",
          "Unable to get your current location. Please check your browser settings."
        )
      );
      return;
    }
    onChange(location);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("address.coordinates", "Address Coordinates")}</Label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          type="button"
          className="flex-1"
          onClick={handleUseMyLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Crosshair className="size-4 shrink-0" />
          )}
          {isLoadingLocation
            ? t("address.gettingLocation", "Getting location…")
            : t("address.useMyLocation", "Use my location")}
        </Button>
        <Button
          variant="outline"
          type="button"
          className="flex-1"
          onClick={onSelectOnMap}
        >
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          {t("address.onMap", "On map")}
        </Button>
      </div>
      <div className="flex min-h-9 items-center rounded-md border bg-muted/40 px-3 py-1.5">
        {coordinates ? (
          <span className="min-w-0 truncate font-mono text-xs tabular-nums">
            {`${coordinates.lat.toFixed(COORDINATE_PRECISION)}, ${coordinates.lng.toFixed(COORDINATE_PRECISION)}`}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("address.noPinSet", "No pin set")}
          </span>
        )}
      </div>
    </div>
  );
};

export default AddressCoordinatesField;

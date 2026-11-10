import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { callFunction, isAbortError } from "../../utils/pocketbase";
import ZeroPad from "../../utils/helpers/zeropad";
import { STATUS_CELL, STATUS_ORDER, useValueLabel } from "./assistant-shared";

interface Home {
  id: string;
  code: string;
  floor: number;
  sequence: number;
  status: string;
  not_home_tries: number;
  notes: string;
}

interface AssistantBuildingProps {
  mapId: string;
  title: string;
  onClose: () => void;
}

// One map's homes laid out as on the map screen: floors from the top down,
// units in visiting order, each coloured by its status.
const AssistantBuilding = ({
  mapId,
  title,
  onClose
}: AssistantBuildingProps) => {
  const { t } = useTranslation();
  const statusLabel = useValueLabel();
  const [homes, setHomes] = useState<Home[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    setHomes(null);
    setFailed(false);
    callFunction("/map/addresses", {
      method: "POST",
      body: { map_id: mapId },
      requestKey: `assistant-building-${mapId}`
    })
      .then((rows) => {
        if (current) setHomes(rows as Home[]);
      })
      .catch((error) => {
        if (current && !isAbortError(error)) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [mapId]);

  const floors = [...new Set((homes ?? []).map((h) => h.floor))].sort(
    (a, b) => b - a
  );
  const byFloor = (floor: number) =>
    (homes ?? [])
      .filter((h) => h.floor === floor)
      .sort((a, b) => a.sequence - b.sequence);
  const counts = new Map<string, number>();
  for (const h of homes ?? []) {
    counts.set(h.status, (counts.get(h.status) ?? 0) + 1);
  }
  const building = floors.length > 1;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("assistant.canvas.backToChat", "Back to chat")}
          onClick={onClose}
        >
          <ArrowLeft />
        </Button>
        <h3 className="min-w-0 flex-1 truncate font-medium">{title}</h3>
      </div>

      {failed ? (
        <p className="text-sm text-muted-foreground">
          {t(
            "assistant.canvas.buildingFailed",
            "The homes could not be loaded."
          )}
        </p>
      ) : !homes ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          {t("assistant.canvas.loading", "Loading…")}
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {STATUS_ORDER.filter((s) => counts.get(s)).map((status) => (
              <li key={status} className="flex items-center gap-1">
                <span
                  className={cn(
                    "size-3 rounded-sm ring-1",
                    STATUS_CELL[status]
                  )}
                />
                {statusLabel(status)} {counts.get(status)}
              </li>
            ))}
          </ul>
          <div className="min-h-0 flex-1 overflow-auto rounded-md border p-2">
            <table className="border-separate border-spacing-1 text-xs">
              <tbody>
                {floors.map((floor) => (
                  <tr key={floor}>
                    {building && (
                      <th
                        scope="row"
                        className="sticky left-0 bg-background pr-1 text-right font-medium text-muted-foreground tabular-nums"
                      >
                        {ZeroPad(String(floor), 2)}
                      </th>
                    )}
                    {byFloor(floor).map((home) => (
                      <td
                        key={home.id}
                        title={`${building ? `#${ZeroPad(String(floor), 2)}-` : ""}${home.code} · ${statusLabel(home.status)}`}
                        className={cn(
                          "relative min-w-10 rounded px-1.5 py-1 text-center tabular-nums ring-1",
                          STATUS_CELL[home.status] ?? STATUS_CELL.not_done
                        )}
                      >
                        {home.code}
                        {home.status === "not_home" &&
                          home.not_home_tries > 0 && (
                            <sup className="ml-0.5 text-[0.6rem]">
                              {home.not_home_tries}
                            </sup>
                          )}
                        {home.notes.trim() && (
                          <span
                            aria-hidden
                            className="absolute top-0.5 left-0.5 size-1.5 rounded-full bg-foreground/60"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "assistant.canvas.buildingKey",
              "Small numbers are nobody-home tries; a dot marks a note."
            )}
          </p>
        </>
      )}
    </div>
  );
};

export default AssistantBuilding;

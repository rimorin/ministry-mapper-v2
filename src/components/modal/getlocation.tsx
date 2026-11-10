import NiceModal from "@ebay/nice-modal-react";
import * as m from "motion/react-m";
import { fadeInDelayed } from "@/lib/motion";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GetMapGeolocationModalProps } from "../../utils/interface";
import DirectionsMap from "../map/directionsmap";

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, name }: GetMapGeolocationModalProps) => {
    const { dialogProps, contentProps } = useBaseUiDialog({
      size: "fullscreen"
    });
    const { t } = useTranslation();

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader className="flex-row items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b gap-2">
            <DialogTitle className="truncate">
              {t("address.locationWithName", "{{name}} Location", { name })}
            </DialogTitle>
            <DialogClose
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <m.div
            className="geolocation-modal-body flex-1 relative overflow-hidden"
            variants={fadeInDelayed}
            initial="hidden"
            animate="show"
          >
            <DirectionsMap coordinates={coordinates} />
          </m.div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default GetMapGeolocation;

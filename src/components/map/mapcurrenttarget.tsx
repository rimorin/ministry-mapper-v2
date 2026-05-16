import React from "react";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapControlProps } from "../../utils/interface";

export const MapCurrentTarget: React.FC<MapControlProps> = ({ onClick }) => (
  <div className="map-current-target-container">
    <Button
      variant="outline"
      size="icon"
      className="min-h-[44px] min-w-[44px] bg-background/95 backdrop-blur-sm shadow-md"
      onClick={onClick}
      aria-label="Recenter to current location"
    >
      <Crosshair className="h-5 w-5" />
    </Button>
  </div>
);

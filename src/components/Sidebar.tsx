import * as React from "react";
import { Collapse } from "@mui/material";

export default function Toggler({
  defaultExpanded = false,
  renderToggle,
  children
}: {
  defaultExpanded?: boolean;
  children: React.ReactNode;
  renderToggle: (params: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultExpanded);
  return (
    <React.Fragment>
      {renderToggle({ open, setOpen })}
      <Collapse in={open} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
      {/* </Box> */}
    </React.Fragment>
  );
}

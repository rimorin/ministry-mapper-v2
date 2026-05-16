import { FC } from "react";

interface DividerProps {
  text: string;
}

const Divider: FC<DividerProps> = ({ text }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs text-muted-foreground">{text}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

export default Divider;

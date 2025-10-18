import { FC } from "react";

interface DividerProps {
  text: string;
}

const Divider: FC<DividerProps> = ({ text }) => (
  <div className="my-3 d-flex align-items-center">
    <hr className="flex-grow-1" />
    <span className="px-3 text-muted small">{text}</span>
    <hr className="flex-grow-1" />
  </div>
);

export default Divider;

// import { Button, Typography } from "@mui/joy";
import { Button, Typography } from "@mui/material";
import { SignInDifferentProps } from "../../utils/interface";

const UseAnotherButton = ({ handleClick }: SignInDifferentProps) => (
  <Button onClick={handleClick}>
    <Typography>Use another email</Typography>
  </Button>
);

export default UseAnotherButton;

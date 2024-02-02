import Calendar from "react-calendar";
import { FormProps } from "../../utils/interface";
import { Stack, Typography } from "@mui/joy";

const DncDateField = ({ handleDateChange, changeDate }: FormProps) => {
  const dateValue = changeDate ? new Date(changeDate) : new Date();
  return (
    <Stack
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
      }}
      spacing={1}
    >
      <Typography level="title-sm">Date</Typography>
      <Calendar onChange={handleDateChange} value={dateValue} />
    </Stack>
  );
};

export default DncDateField;

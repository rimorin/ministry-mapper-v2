import { FormProps } from "../../utils/interface";
import { Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers";
// import { Stack, Typography } from "@mui/joy";

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
      <Typography variant="subtitle1">Date</Typography>
      <DateCalendar
        value={dayjs(dateValue)}
        onChange={(value) =>
          handleDateChange && handleDateChange(value as Date)
        }
      />
    </Stack>
  );
};

export default DncDateField;

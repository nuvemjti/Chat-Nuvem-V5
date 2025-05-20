import React from "react";
import { TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

const DatePickerMoment = ({ label, getDate }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        label={label}
        onChange={(newValue) => {
          getDate(newValue ? moment(newValue).format("YYYY-MM-DD") : "");
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
      />
    </LocalizationProvider>
  );
};

export default DatePickerMoment; 
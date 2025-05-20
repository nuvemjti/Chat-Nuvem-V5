import React, { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

function VariableCondition({
  item,
  position,
  updateValue,
  showOptions,
  setShowOptions,
}) {
  const [showInputNumber, setShowInputNumber] = useState(false);

  const variables = ["nome", "idade"];

  const conditions = {
    idade: ["Maior que", "Menor que"],
    nome: ["Possui algum valor"],
  };

  const handleFieldChange = (key, value) => {
    console.log(position, key, value);
    updateValue(position, key, value);
  };

  return (
    <Box my={2}>
      {/* MOSTRAR VARIÁVEL E A CONDIÇÃO */}
      <Box
        onClick={() => setShowOptions((prev) => (prev > -1 ? -1 : position))}
        sx={{
          backgroundColor: "#8ecae6",
          border: "4px solid #00b4d8",
          py: "10px",
          px: "10px",
          cursor: "default",
          borderRadius: 2,
        }}
      >
        <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
          {item.variableName}
        </Typography>
        <Typography variant="body2">{item.primaryCondition}</Typography>
      </Box>

      {/* ESCOLHER VERIÁVEIS */}
      {showOptions === position && (
        <Paper sx={{ p: 2, mt: 1 }} elevation={3}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id={`select-label-${position}`}>Variável</InputLabel>
              <Select
                labelId={`select-label-${position}`}
                value={item.variableName}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFieldChange("variableName", e.target.value);
                }}
              >
                {variables.map((variable) => (
                  <MenuItem key={variable} value={variable}>
                    {variable}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Condição</InputLabel>
              <Select
                value={item.primaryCondition}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "Possui algum valor") {
                    handleFieldChange("primaryCondition", value);
                    setShowOptions(-1);
                  } else if (value === "Maior que" || value === "Menor que") {
                    handleFieldChange("primaryCondition", value);
                    setShowInputNumber(true);
                  }
                }}
              >
                {conditions[item.variableName]?.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {showInputNumber && (
            <Box sx={{ mb: 3 }} >
              <TextField
                fullWidth
                value={item.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFieldChange("value", e.target.value);
                }}
                id="outlined-basic"
                label="Número"
                variant="outlined"
              />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default VariableCondition;

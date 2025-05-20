import React, { useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Button,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { labels } from "./constants";
import { FaTrash } from "react-icons/fa";


function DayOfWeekCondition({
  item,
  position,
  updateValue,
  deleteItem,
  showOptions,
  setShowOptions,
}) {
  // Função para listar os dias da semana

  const getAllDaysOfWeek = () => {
    const allDaysOfWeek = [];
    const firstDayOfWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Começo da semana { domingo por padrão }

    for (let i = 0; i < 7; i++) {
      // Formata a data para exibir o nome do dia
      const day = format(
        new Date(firstDayOfWeek.getDate() + i * 24 * 60 * 60 * 1000),
        "eeee",
        { locale: ptBR }
      );
      allDaysOfWeek.push(day);
    }
    return allDaysOfWeek;
  };

  const conditions = {
    dayOfWeek: ["igual", "diferente"],
  };

  const handleFieldChange = (key, value) => {
    updateValue(position, key, value);
  };

  return (
    <Box my={2}>
      {/* MOSTRAR VARIÁVEL E A CONDIÇÃO */}
      <Box
        sx={{
          width: "100%",
          border: "4px solid #00b4d8",
          borderRadius: 2,
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#8ecae6",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            py: "10px",
            px: "10px",
            cursor: "default",
          }}
          onClick={() => setShowOptions((prev) => (prev > -1 ? -1 : position))}
        >
          <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
            {labels[item.type]}
          </Typography>
          <Box>
            <Typography variant="body2">{item.primaryCondition}</Typography>
            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
              {item.variableName}
            </Typography>
          </Box>
        </Box>
        <Button onClick={() => deleteItem(position)} sx={{ padding: 2, mr: 1 }}>
          <FaTrash size={24} />
        </Button>
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
                {getAllDaysOfWeek().map((variable) => (
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
                  handleFieldChange("primaryCondition", value);
                  setShowOptions(-1);
                }}
              >
                {conditions.dayOfWeek.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default DayOfWeekCondition;

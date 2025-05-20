import React, { useReducer, useCallback, useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { FiHelpCircle, FiPlus, FiMinus, FiCheck } from "react-icons/fi";

import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormHelperText,
  Paper,
} from "@mui/material";

const initialState = {
    primaryCondition: "",
    secondaryCondition: "",
    value: "",
    errors: {},
};

function conditionReducer(state, action) {
    switch (action.type) {
      case "SET_FIELD":
        return {
          ...state,
          [action.field]: action.value,
        };
      case "SET_ERROR":
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.field]: action.error,
          },
        };
      case "RESET":
        return initialState;
      default:
        return state;
    }
  }

export function VariablesView({
    openMenu
}) {
    const [state, dispatch] = useReducer(conditionReducer, initialState);
    const [variables, setVariables] = useState([]);

    
      const conditions = {
        numeric: ["equals", "greater than", "less than"],
        text: ["contains", "starts with", "ends with"],
        date: ["before", "after", "between"],
      };

      useEffect(() => {
        const localVariables = localStorage.getItem("variables");
        if (localVariables) {
          setVariables(JSON.parse(localVariables));
        }
      }, [])
    return (
        <Box>
            {state.ruleType && (
                <Box sx={{ mb: 3 }}>
                <TextField
                    select
                    fullWidth
                    label="Condition"
                    value={state.primaryCondition}
                    onChange={(e) =>
                        dispatch({
                            type: "SET_FIELD",
                            field: "primaryCondition",
                            value: e.target.value,
                        })
                    }
                >
                    {conditions[state.ruleType].map((condition) => (
                    <MenuItem key={condition} value={condition}>
                        {condition}
                    </MenuItem>
                    ))}
                </TextField>
                </Box>
            )}
            {state.primaryCondition && (
                <TextField
                    select
                    fullWidth
                    label="Rule Type"
                    value={state.ruleType}
                    onChange={(e) =>{
                        const value = e.target.value
                        openMenu(false)
                        console.log("Variável escolhida: ", value)
                    }}
                >
                {variables.map((option, index) => (
                    <MenuItem key={index} value={option}>
                    {option}
                    </MenuItem>
                ))}
                </TextField>
            )}
        </Box>
    )
}

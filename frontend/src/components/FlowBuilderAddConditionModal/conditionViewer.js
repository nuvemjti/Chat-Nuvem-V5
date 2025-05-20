import React, { useState, useRef, useReducer, useEffect } from "react";
import {
  Paper,
  Grid,
  Button,
  Box,
  TextField,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import { FaTrash } from "react-icons/fa";
import { FiHelpCircle, FiPlus, FiMinus, FiCheck } from "react-icons/fi";
import { conditions, ruleTypes } from "./constants";

export const ConditionViewer = ({ option, position, tags, update }) => {
  const inputRef = useRef(); // Reference to the custom select input element

  //const [currentState, setInitialState] = useState(option);

  const [showMenu, setShowMenu] = useState(false); // Controls the visibility of the dropdown menu
  const closeSelectView = (e) => {
    setShowMenu(!showMenu);
  };

  // Icon component
  const Icon = () => {
    return (
      <Button>
        <FaTrash size={14} color="#2f6690" />
      </Button>
    );
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box
        sx={{
          backgroundColor: "#8ecae6",
          border: "4px solid #00b4d8",
          py: "20px",
          px: "10px",
          fontSize: 16,
          display: "flex",
          fontFamily: "sans-serif",
          cursor: "default",
          borderRadius: 2,
        }}
        ref={inputRef}
        onClick={closeSelectView}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid container spacing={2}>
          <Grid item>
            <Box>
              {option.primaryCondition === "" ? (
                "Igual"
              ) : (
                <span>{option.primaryCondition}</span>
              )}
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ px: 2 }}>➡</Box>
          </Grid>
          <Grid item>
            <Box>{option.fieldName}</Box>
          </Grid>
        </Grid>
        <Box>
          <div className="dropdown-tool">
            <Icon isOpen={showMenu} />
          </div>
        </Box>
      </Box>
      {showMenu && (
        <Paper
          elevation={1}
          sx={{
            padding: 2,
          }}
        >
          <Box>
            <Box sx={{ mb: 3 }}>
              <TextField
                select
                fullWidth
                label="Tags"
                value={option.fieldName}
                onChange={(e) => {
                  const value = e.target.value;
                  //setInitialState((state) => ({ ...state, fieldName: value }));
                  update(
                    {
                      ...option,
                      fieldName: value,
                    },
                    position
                  );
                }}
              >
                {tags.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                    <Tooltip
                      title={`Select for ${option.name.toLowerCase()} based conditions`}
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <FiHelpCircle />
                      </IconButton>
                    </Tooltip>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                select
                fullWidth
                label="Condition"
                value={option.primaryCondition}
                onChange={(e) => {
                  const value = e.target.value;

                  update({ ...option, primaryCondition: value }, position);
                  closeSelectView();
                }}
              >
                {conditions.tag.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

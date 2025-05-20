import React, { useState, useEffect, useRef, useReducer } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import { styled } from "@mui/material/styles";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import {
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  ListSubheader,
  Box,
  FormControl,
  InputLabel,
  Stack,
} from "@mui/material";
import VariableCondition from "./VariableCondition";
import { labels, options } from "./constants";
import DayOfWeekCondition from "./DayOfWeekCondition";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const selectFieldStyles = {
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#909090",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#000000",
    borderWidth: "thin",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0000FF",
    borderWidth: "thin",
  },
};

const CustomSelect = styled(Select)(({ theme }) => ({
  backgroundColor: "#ffffff",
  "&.MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#e0e0e0",
    },
    "&:hover fieldset": {
      borderColor: "#bdbdbd",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1976d2",
    },
  },
}));

const CenteredListSubheader = styled(ListSubheader)({
  textAlign: "center",
  fontWeight: 600,
});

const ContactSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Muito curto!")
    .max(50, "Muito longo!")
    .required("Digite um nome!"),
  text: Yup.string()
    .min(2, "Muito curto!")
    .max(50, "Muito longo!")
    .required("Digite uma mensagem!"),
});

const initialState = {
  items: [],
};

function conditionReducer(state = initialState, action) {
  switch (action.type) {
    case "ADD_OBJECT":
      return {
        ...state,
        items: [
          ...state.items, 
          action.payload // Adiciona o novo objeto ao array
        ],
      };
    case "LOAD": {
      return {
        items: action.payload,
      };
    }
    case "DELETE_ITEM":
      return {
        items: [
          ...state.items.slice(0, action.payload.index), // Pega os itens antes do índice
          ...state.items.slice(action.payload.index + 1), // Pega os itens depois do índice
        ],
      };
    case "UPDATE_VALUE":
      // Ação para editar o valor de um campo específico
      return {
        ...state,
        items: state.items.map(
          (item, index) =>
            index === action.payload.index
              ? { ...item, [action.payload.key]: action.payload.value } // Atualiza o valor da chave
              : item // Retorna o item inalterado
        ),
      };
    default:
      return state;
  }
}


const FlowBuilderAddConditionModal = ({
  open,
  onSave,
  onUpdate,
  data,
  close,
}) => {
  const classes = useStyles();
  const [state, dispatch] = useReducer(conditionReducer, initialState);
  const [showOptions, setShowOptionsPosition] = useState(-1);
  const [activeModal, setActiveModal] = useState(false);
  const [condition, setCondition] = useState("AND");
  const isMounted = useRef(true);

  useEffect(() => {
    if (open === "edit") {
      const condition = data.data.condition;
      const items = data.data.options;
      
      dispatch({ type: "LOAD", payload: items }); // Disparando a ação para carregar os dados no reducer
      
      setCondition(condition);
      setActiveModal(true);
    } else if (open === "create") {
      
      setActiveModal(true);
    }
    return () => {
      isMounted.current = false;
    };
  }, [open]);

  const handleConditionChange = (e) => {
    const event = e.targeta.value;
    setCondition(event);
  };

  const handleClose = () => {
    close(null);
    setActiveModal(false);
  };

  const handleUpdateValue = (index, key, value) => {
    dispatch({
      type: "UPDATE_VALUE",
      payload: { index, key, value },
    });
  };

  const handleSaveContact = async () => {
    if (!state.items.length) {
      return toast.error("Adicione uma condição");
    }

    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: {
          condition: condition,
          options: state.items,
        },
      });
    } else if (open === "create") {
      handleClose();
      onSave({
        options: {
          condition: condition,
          options: state.items,
        },
      });
    }
  };

  const deleteItem = (index) => {
    dispatch({
      type: "DELETE_ITEM",
      payload: { index  },
    });
  };


  const renderValue = () => {
    return "Selecionar condição";
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {open === "create"
            ? `Adicionar uma condicional ao fluxo`
            : `Editar condicional`}
        </DialogTitle>
        <Stack>
          <Stack dividers style={{ gap: "8px", padding: "16px" }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Defina as condições e regra lógica para que o fluxo continue pela
              saída superior deste bloco:
            </Typography>
            <RadioGroup value={condition}>
              <FormControlLabel
                onChange={handleConditionChange}
                value="AND"
                control={<Radio color="secondary" />}
                label={
                  <span>
                    Regra corresponde a <strong>todas</strong> as condições (e)
                  </span>
                }
              />
              <FormControlLabel
                onChange={handleConditionChange}
                value="OR"
                control={<Radio color="secondary" />}
                label={
                  <span>
                    Regra corresponde a <strong>qualquer</strong> condição (ou)
                  </span>
                }
              />
            </RadioGroup>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Defina as condições e regra lógica para que o fluxo continue pela
              saída superior deste bloco:
            </Typography>

            {state.items.length > 0 && (
              <Box sx={{ mt: 4 }}>
                {state.items.map((item, position) => {
                  if (item.type === "variable") {
                    return (
                      <VariableCondition
                        item={item}
                        position={position}
                        updateValue={handleUpdateValue}
                        deleteItem={deleteItem}
                        showOptions={showOptions}
                        setShowOptions={setShowOptionsPosition}
                      />
                    );
                  }
                  if (item.type === "dayOfWeek") {
                    return (
                      <DayOfWeekCondition
                        item={item}
                        position={position}
                        updateValue={handleUpdateValue}
                        deleteItem={deleteItem}
                        showOptions={showOptions}
                        setShowOptions={setShowOptionsPosition}
                      />
                    );
                  }
                })}
              </Box>
            )}
          
            <CustomSelect
              value={""}
              onChange={(e) => {
                const choice = e.target.value;
                dispatch({
                  type: "ADD_OBJECT",
                  payload: {
                    id: Math.random(),
                    type: choice,
                    fieldName: "",
                    primaryCondition: "Possui algum valor",
                    secondaryCondition: "",
                  },
                });
              }}
              renderValue={renderValue}
              displayEmpty
            >
              <MenuItem disabled value="">
                <em>Selecionar condição</em>
              </MenuItem>
              <CenteredListSubheader>Sistema</CenteredListSubheader>
              {options.map((option) => {
               if (labels[option]) {
                return (
                  <MenuItem key={option} value={option}>
                    {labels[option]}
                  </MenuItem>
                );
              }
              })}
            </CustomSelect>
            <pre>{JSON.stringify(state, null, 2)}</pre>
          </Stack>
          <DialogActions>
            <Button onClick={handleClose} color="secondary" variant="outlined">
              {i18n.t("contactModal.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              className={classes.btnWrapper}
              onClick={() => handleSaveContact()}
            >
              {open === "create" ? `Adicionar` : "Editar"}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </div>
  );
};

export default FlowBuilderAddConditionModal;

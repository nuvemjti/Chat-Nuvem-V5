import React, { useState, useEffect, useRef, useMemo, useReducer } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";
import InputLabel from "@material-ui/core/InputLabel";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";

import DialogTitle from "@material-ui/core/DialogTitle";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Grid, Stack } from "@mui/material";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  Autocomplete,
  AccordionDetails,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { fetch } from "whatwg-fetch";
import { ExpandMore, Add, Close } from "@material-ui/icons";
import { Trash } from "lucide-react";

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

const initialValues = {
  variables: [],
};

function requestReducer(state, action) {
  switch (action.type) {
    case "load":
      return {
        ...state,
        variables: action.payload,
      };
    case "setUrl":
      return { ...state, url: action.payload };
    case "setMethod":
      return { ...state, method: action.payload };
    case "setHeaders":
      return { ...state, headers: action.payload };
    case "setBody":
      return { ...state, body: action.payload };
    case "setResponse":
      return { ...state, response: action.payload };
    case "setLoading":
      return { ...state, loading: action.payload };
    case "setError":
      return { ...state, error: action.payload };
    case "setAdvancedConfig":
      return { ...state, advancedConfig: action.payload };
    case "setVariables":
      return {
        ...state,
        variables: [...state.variables, action.payload],
      };
    case "removeVariable":
      return {
        ...state,
        variables: state.variables.filter(
          (_, index) => index !== action.payload.index
        ),
      };
    case "updateVariable":
      return {
        ...state,
        variables: state.variables.map((variable, index) => {
          if (action.payload.value) {
            return index === action.payload.index
              ? { ...variable, [action.payload.key]: action.payload.value }
              : variable;
          }
        }),
      };
    case "setNewVariable":
      return { ...state, newVariable: action.payload };
    default:
      return state;
  }
}

const FlowBuilderAddRequestHTTPModal = ({
  open,
  onSave,
  data,
  onUpdate,
  close,
}) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const [state, dispatch] = useReducer(requestReducer, initialValues);

  const [activeModal, setActiveModal] = useState(false);
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advancedConfig, setAdvancedConfig] = useState(false);
  const [variables, setVariables] = useState([]);
  const [newVariable, setNewVariable] = useState({ path: "", name: "" });

  const [headerOptions, setHeaderOptions] = useState({
    method: "",
    headers: "",
    body: "",
  });

  useEffect(() => {
    console.log("139", data);
    if (open === "edit") {
      (async () => {
        try {
          setActiveModal(true);

          // Carregar URL e variáveis do data
          if (data) {
            const varList = data.data.request?.variables;
            setUrl(data.data.request.url || ""); // Carregar a URL
            const method = data.data.request.headerOptions?.method || "GET" // Carregar o método
            const body = data.data.request.headerOptions.body
            const headers = data.data.request.headerOptions.headers

            if(method && body){
              setAdvancedConfig(true)
            }
            setHeaderOptions({ method, body, headers})

            dispatch({ type: "load", payload: varList || [] }); // Carregar as variáveis
          }
        } catch (error) {
          console.log(error);
        }
      })();
    } else if (open === "create") {
      (async () => {
        try {
          setActiveModal(true);

          // Resetar os valores ao criar
          setUrl("");
          setVariables([]);
        } catch (error) {
          console.log(error);
        }
      })();
    }
    return () => {
      isMounted.current = false;
    };
  }, [open]);


  const handleClose = () => {
    close(null);
    setActiveModal(false);
  };

  const handleSaveContact = () => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: {
          request: {
            headerOptions,
            url: url,
            ...state,
          },
        },
      });
    } else if (open === "create") {
      handleClose();
      onSave({
        request: {
          headerOptions,
          url,
          ...state,
        },
      });
    }
  };

  /**
   * Recursively generates an array of paths for all keys in a given object.
   *
   * @param {Object} obj - The object to extract paths from.
   * @param {string} [parentPath=""] - The base path to prepend to each key path.
   * @returns {string[]} An array of strings representing the paths of all keys in the object.
   */
  const getObjectPaths = (obj, parentPath = "") => {
    if (!obj || typeof obj !== "object") return [];

    return Object.entries(obj).reduce((paths, [key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      console.log(currentPath);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return [...paths, currentPath, ...getObjectPaths(value, currentPath)];
      }

      return [...paths, currentPath];
    }, []);
  };

  const availablePaths = useMemo(() => {
    if (!response?.data) return [];
    return getObjectPaths(response.data);
  }, [response?.data]);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    
    try {


      let parsedHeaders = {};
    try {
      parsedHeaders = headerOptions?.headers ? {"Content-Type": "application/json",...JSON.parse(headerOptions.headers)} : {};
    } catch (err) {
      setError("Cabeçalhos inválidos. Certifique-se de que estão no formato JSON.");
      setLoading(false);
      return;
    }

    let parsedBody = undefined;
    if (headerOptions.method !== "GET" && headerOptions.body) {
      try {
        parsedBody = JSON.stringify(JSON.parse(headerOptions.body));
      } catch (err) {
        setError("Body inválido. Certifique-se de que está no formato JSON.");
        setLoading(false);
        return;
      }
    }

      const options = {
        method: headerOptions.method,
        headers: parsedHeaders,
        body: headerOptions.method !== "GET" && parsedBody ? parsedBody : undefined,
      };

      console.log("options", options);

      
      const response = await fetch(url, options);
      const data = await response.json();

      setResponse({
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });


      // Update variables with new response data
      setVariables((prevVars) =>
        prevVars.map((variable) => ({
          ...variable,
          value: getValueFromPath(data, variable.path),
        }))
      );
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getValueFromPath = (obj, path) => {
    try {
      return path.split(".").reduce((acc, part) => acc[part], obj);
    } catch {
      return undefined;
    }
  };

  const handleAddVariable = () => {
    dispatch({ type: "setVariables", payload: { placeholder: "", field: "" } });
  };

  const handleRemoveVariable = (index) => {
    dispatch({ type: "removeVariable", payload: { index } });
  };

  const handleRequestHeaders = (e) => {
    const { name, value } = e.target

    // Atualiza o estado mantendo os valores antigos
    setHeaderOptions((prevState) => ({
      ...prevState,
      [name]: value,
    }));

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
            ? `Adicionar  Requisição HTTP ao fluxo`
            : `Editar Requisição HTTP do fluxo`}
        </DialogTitle>
        <Stack>
          <Stack dividers style={{ gap: "8px", padding: "16px" }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                margin="normal"
                placeholder="https://api.example.com/endpoint"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={advancedConfig}
                    onChange={(e) => setAdvancedConfig(e.target.checked)}
                  />
                }
                label="Advanced configuration"
              />
            </Box>

            {advancedConfig && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Metodo</InputLabel>
                  <Select
                    value={headerOptions.method}
                    name="method"
                    onChange={handleRequestHeaders}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Cabeçalho</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={headerOptions.headers}
                      name="headers" // Define o nome do campo
                      onChange={handleRequestHeaders}
                      placeholder='{"Content-Type": "application/json"}'
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Body</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={headerOptions.body}
                      name="body"
                      onChange={handleRequestHeaders}
                      placeholder='{"key": "value"}'
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleRequest}
              disabled={loading || !url}
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Test Request"}
            </Button>

            {error && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "#ffebee" }}>
                <Typography color="error">{error}</Typography>
              </Paper>
            )}

            <>
              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>
                      Status da resposta: {response?.status || "Nenhum"}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2">Cabeçalho:</Typography>
                    <pre style={{ overflow: "auto" }}>
                      {response?.headers ? (
                        <>{JSON.stringify(response.headers, null, 2)}</>
                      ) : (
                        "Nenhum"
                      )}
                    </pre>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Dados:
                    </Typography>
                    <pre style={{ overflow: "auto" }}>
                      {response?.data ? (
                        <>{JSON.stringify(response.data, null, 2)}</>
                      ) : (
                        "Nenhum"
                      )}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Salvar como variável</Typography>
                  </AccordionSummary>
                  {(state.variables.length && (
                    <AccordionDetails>
                      <Paper
                        sx={{
                          p: 2,
                        }}
                      >
                        {state.variables.map((variable, index) => {
                          console.log(variable);
                          if (variable) {
                            return (
                              <React.Fragment key={index}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                  >
                                    Data:
                                  </Typography>
                                  <Autocomplete
                                    freeSolo
                                    options={availablePaths}
                                    value={state.variables[index].placeholder}
                                    onChange={(_, newValue) => {
                                      dispatch({
                                        type: "updateVariable",
                                        payload: {
                                          index,
                                          key: "placeholder",
                                          value: newValue,
                                        },
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        size="small"
                                        placeholder="data.field.name"
                                        onChange={(e) => {
                                          const placeholder = e.target.value;
                                          dispatch({
                                            type: "updateVariable",
                                            payload: {
                                              index,
                                              key: "placeholder",
                                              value: placeholder,
                                            },
                                          });
                                        }}
                                      />
                                    )}
                                  />
                                </Box>
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                  >
                                    Set variable:
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <TextField
                                      fullWidth
                                      value={state.variables[index].field}
                                      onChange={(e) => {
                                        const field = e.target.value || "";

                                        dispatch({
                                          type: "updateVariable",
                                          payload: {
                                            index,
                                            key: "field",
                                            value: field,
                                          },
                                        });
                                      }}
                                      size="small"
                                      placeholder="variableName"
                                    />
                                  </Box>
                                </Box>
                                <Box sx={{ py: 2 }}>
                                  <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => handleRemoveVariable(index)}
                                    color="warning"
                                  >
                                    <Trash />
                                  </Button>
                                </Box>
                              </React.Fragment>
                            );
                          }
                          return null;
                        })}
                      </Paper>
                    </AccordionDetails>
                  )) || (
                    <Typography sx={{ textAlign: "center" }}>
                      Nenhuma variável
                    </Typography>
                  )}
                  <Button
                    sx={{
                      m: "auto",
                    }}
                    color="primary"
                    fullWidth
                    onClick={handleAddVariable}
                  >
                    <Add />
                  </Button>
                </Accordion>
              </Box>
            </>
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
              onClick={handleSaveContact}
            >
              {open === "create" ? `Adicionar` : "Editar"}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </div>
  );
};

export default FlowBuilderAddRequestHTTPModal;

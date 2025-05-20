import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Grid, Stack, Chip } from "@mui/material";

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

const FlowBuilderAttendantModal = ({ open, onSave, data, onUpdate, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const initialState = {
    queue: "",
    user: "",
  };

  const [activeModal, setActiveModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (open === "edit") {
      (async () => {
        try {
          const allUserSelected = data.data.user;

          const { data: result } = await api.get("/users");

          console.log(78, allUserSelected);
          setUsers(result.users);

          setActiveModal(true);
        } catch (error) {
          console.log(error);
        }
      })();
    } else if (open === "create") {
      (async () => {
        try {
          const { data: result } = await api.get("/users");
          setUsers(result.users);

          setSelectedUsers("");
          setActiveModal(true);
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
    if (!selectedUsers || selectedUsers.length === 0) {
      return toast.error("Adicione pelo menos um atendente");
    }

    const allUsersSelected = users.filter((user) =>
      selectedUsers.includes(user.id)
    );

    if (open === "edit") {
      onUpdate({
        ...data,
        data: {
          users: allUsersSelected, // Salva os usuários selecionados
        },
      });
    } else if (open === "create") {
      onSave({
        users: allUsersSelected, // Salva os usuários selecionados
      });
    }

    handleClose();
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
          {open === "create" ? `Adicionar uma fila ao fluxo` : `Editar fila`}
        </DialogTitle>
        <Stack>
          <DialogContent dividers>
            <Grid style={{ width: "100%", marginTop: 40 }} container>
              <Typography>Escolha um atendente</Typography>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                multiple // Permite múltiplas seleções
                value={selectedUsers || []} // Garante que o estado seja um array
                style={{ width: "95%" }}
                onChange={(e) => {
                  setSelectedUsers(e.target.value); // Atualiza o estado com os valores selecionados
                }}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={(selected) => (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {selected.map((value) => {
                      const user = users.find((usr) => usr.id === value);
                      return (
                        <Chip
                          key={value}
                          label={user?.name || "Usuário desconhecido"}
                          style={{ margin: "2px" }}
                        />
                      );
                    })}
                  </div>
                )}
              >
                {/* Adiciona a opção vazia */}
                <MenuItem value="">
                  <em>Selecione um usuário</em>
                </MenuItem>

                {/* Exibe a lista de usuários */}
                {users.length > 0 &&
                  users.map((user, index) => (
                    <MenuItem dense key={index} value={user.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {/* Círculo indicando o status online/offline */}
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: user.online ? "green" : "red",
                          }}
                        ></div>
                        {user.name}
                      </div>
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
          </DialogContent>
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

export default FlowBuilderAttendantModal;

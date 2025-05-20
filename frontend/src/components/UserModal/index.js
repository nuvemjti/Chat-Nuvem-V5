import React, { useContext, useEffect, useRef, useState } from "react";

import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import * as Yup from "yup";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import useWhatsApps from "../../hooks/useWhatsApps";
import api from "../../services/api";
import QueueSelect from "../QueueSelect";

import { Grid, Paper, Tab, Tabs } from "@material-ui/core";
import { getBackendUrl } from "../../config";
import AvatarUploader from "../AvatarUpload";
import { Can } from "../Can";
import TabPanel from "../TabPanel";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const backendUrl = getBackendUrl();
const path = require("path");

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
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
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  container: {
    display: "flex",
    flexWrap: "wrap",
  },
  avatar: {
    width: theme.spacing(12),
    height: theme.spacing(12),
    margin: theme.spacing(2),
    cursor: "pointer",
    borderRadius: "50%",
    border: "2px solid #ccc",
  },
  updateDiv: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  updateInput: {
    display: "none",
  },
  updateLabel: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    textTransform: "uppercase",
    textAlign: "center",
    cursor: "pointer",
    border: "2px solid #ccc",
    borderRadius: "5px",
    minWidth: 160,
    fontWeight: "bold",
    color: "#555",
  },
  errorUpdate: {
    border: "2px solid red",
  },
  errorText: {
    color: "red",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
  email: Yup.string().email("Invalid email").required("Required"),
  allHistoric: Yup.string().nullable(),
});

const UserModal = ({ open, onClose, userId }) => {
  const classes = useStyles();

  const initialState = {
    name: "",
    email: "",
    password: "",
    profile: "user",
    startWork: "00:00",
    endWork: "23:59",
    farewellMessage: "",
    allTicket: "disable",
    allowGroup: false,
    defaultTheme: "light",
    defaultMenu: "open",
    allHistoric: "disabled",
    allUserChat: "disabled",
    userClosePendingTicket: "enabled",
    showDashboard: "disabled",
    allowRealTime: "disabled",
    allowContacts: "disabled",
    allowKanban: "disabled",
    allowCampaigns: "disabled",
    allowConnections: "disabled",
    wpp: "",
  };

  const { user: loggedInUser } = useContext(AuthContext);

  const [user, setUser] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [whatsappId, setWhatsappId] = useState(false);
  // const [allTicket, setAllTicket] = useState("disable");
  const { loading, whatsApps } = useWhatsApps();
  const [profileUrl, setProfileUrl] = useState(null);
  const [tab, setTab] = useState("general");
  const [avatar, setAvatar] = useState(null);
  const startWorkRef = useRef();
  const endWorkRef = useRef();
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const { data } = await api.get(`/users/${userId}`);
        setUser((prevState) => {
          return { ...prevState, ...data };
        });

        const { profileImage } = data;
        setProfileUrl(
          `${backendUrl}/public/company${data.companyId}/user/${profileImage}`
        );

        const userQueueIds = data.queues?.map((queue) => queue.id);
        setSelectedQueueIds(userQueueIds);
        setWhatsappId(data.whatsappId ? data.whatsappId : "");
      } catch (err) {
        toastError(err);
      }
    };

    fetchUser();
  }, [userId, open]);

  const handleClose = () => {
    onClose();
    setUser(initialState);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSaveUser = async (values) => {
    const uploadAvatar = async (file) => {
      const formData = new FormData();
      formData.append("userId", file.id);
      formData.append("typeArch", "user");
      formData.append("profileImage", avatar);

      const { data } = await api.post(
        `/users/${file.id}/media-upload`,
        formData
      );

      localStorage.setItem("profileImage", data.user.profileImage);
    };

    const userData = {
      ...values,
      whatsappId,
      queueIds: selectedQueueIds,
    };

    try {
      if (userId) {
        const { data } = await api.put(`/users/${userId}`, userData);
        if (
          avatar &&
          (!user?.profileImage || !user?.profileImage !== avatar.name)
        )
          // getBasename(avatar)))
          await uploadAvatar(data);
      } else {
        await api.post("/users", userData);

        if (!user?.profileImage && avatar) await uploadAvatar(user);
      }
      if (userId === loggedInUser.id) {
        handleClose();
        toast.success(i18n.t("userModal.success"));

        setTimeout(() => {
          window.location.reload(); // Recarrega a página
        }, 1000); // 1000ms = 1 segundo
      } else {
        handleClose();
        toast.success(i18n.t("userModal.success"));

        setTimeout(() => {
          window.location.reload(); // Recarrega a página
        }, 1000); // 1000ms = 1 segundo
      }
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {userId
            ? `${i18n.t("userModal.title.edit")}`
            : `${i18n.t("userModal.title.add")}`}
        </DialogTitle>
        <Formik
          initialValues={user}
          enableReinitialize={true}
          validationSchema={UserSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveUser(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, setFieldValue }) => (
            <Form>
              <Paper className={classes.mainPaper} elevation={1}>
                <Tabs
                  value={tab}
                  indicatorColor="primary"
                  textColor="primary"
                  scrollButtons="on"
                  variant="scrollable"
                  onChange={handleTabChange}
                  className={classes.tab}
                >
                  <Tab
                    label={i18n.t("userModal.tabs.general")}
                    value={"general"}
                  />
                  <Tab
                    label={i18n.t("userModal.tabs.permissions")}
                    value={"permissions"}
                  />
                </Tabs>
              </Paper>
              <Paper className={classes.paper} elevation={0}>
                <DialogContent dividers>
                  <TabPanel
                    className={classes.container}
                    value={tab}
                    name={"general"}
                  >
                    <Grid
                      container
                      spacing={1}
                      alignContent="center"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <FormControl className={classes.updateDiv}>
                        <AvatarUploader
                          setAvatar={setAvatar}
                          avatar={user.profileImage}
                          companyId={user.companyId}
                        />
                        {user.profileImage && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                              user.profileImage = null;
                              setFieldValue("profileImage", null);
                              setAvatar(null);
                            }}
                          >
                            {i18n.t("userModal.title.removeImage")}
                          </Button>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={6} xl={6}>
                        <Field
                          as={TextField}
                          label={i18n.t("userModal.form.name")}
                          autoFocus
                          name="name"
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6} xl={6}>
                        <Field
                          as={TextField}
                          label={i18n.t("userModal.form.password")}
                          type="password"
                          name="password"
                          error={touched.password && Boolean(errors.password)}
                          helperText={touched.password && errors.password}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={8} xl={8}>
                        <Field
                          as={TextField}
                          label={i18n.t("userModal.form.email")}
                          name="email"
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={4} xl={4}>
                        <FormControl
                          variant="outlined"
                          //className={classes.formControl}
                          margin="dense"
                          fullWidth
                        >
                          <Can
                            role={loggedInUser.profile}
                            perform="user-modal:editProfile"
                            yes={() => (
                              <>
                                <InputLabel id="profile-selection-input-label">
                                  {i18n.t("userModal.form.profile")}
                                </InputLabel>

                                <Field
                                  as={Select}
                                  label={i18n.t("userModal.form.profile")}
                                  name="profile"
                                  labelId="profile-selection-label"
                                  id="profile-selection"
                                  required
                                >
                                  <MenuItem value="admin">Admin</MenuItem>
                                  <MenuItem value="user">User</MenuItem>
                                </Field>
                              </>
                            )}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                    <div className={classes.multFieldLine}>
                      <Field name="wpp">
                        {({ field, form }) => (
                          <PhoneInput
                            country={"br"} // Define o Brasil como país padrão
                            value={field.value}
                            onChange={(value) =>
                              form.setFieldValue("wpp", value)
                            }
                            inputStyle={{
                              width: "100%", // Garante que o input ocupe toda a largura disponível
                              height: "40px",
                              fontSize: "16px",
                            }}
                            inputProps={{
                              name: "wpp",
                              required: true,
                            }}
                          />
                        )}
                      </Field>
                      {touched.wpp && errors.wpp && (
                        <p style={{ color: "red", fontSize: "12px" }}>
                          {errors.wpp}
                        </p>
                      )}
                    </div>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={12} xl={12}>
                        <Can
                          role={loggedInUser.profile}
                          perform="user-modal:editQueues"
                          yes={() => (
                            <QueueSelect
                              selectedQueueIds={selectedQueueIds}
                              onChange={(values) => setSelectedQueueIds(values)}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={12} xl={12}>
                        <Can
                          role={loggedInUser.profile}
                          perform="user-modal:editProfile"
                          yes={() => (
                            <FormControl
                              variant="outlined"
                              margin="dense"
                              className={classes.maxWidth}
                              fullWidth
                            >
                              <InputLabel>
                                {i18n.t("userModal.form.whatsapp")}
                              </InputLabel>
                              <Field
                                as={Select}
                                value={whatsappId}
                                onChange={(e) => setWhatsappId(e.target.value)}
                                label={i18n.t("userModal.form.whatsapp")}
                              >
                                <MenuItem value={""}>&nbsp;</MenuItem>
                                {whatsApps.map((whatsapp) => (
                                  <MenuItem
                                    key={whatsapp.id}
                                    value={whatsapp.id}
                                  >
                                    {whatsapp.name}
                                  </MenuItem>
                                ))}
                              </Field>
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                    <Can
                      role={loggedInUser.profile}
                      perform="user-modal:editProfile"
                      yes={() => (
                        <Grid container spacing={1}>
                          <Grid item xs={12} md={6} xl={6}>
                            <Field
                              as={TextField}
                              label={i18n.t("userModal.form.startWork")}
                              type="time"
                              ampm={"false"}
                              inputRef={startWorkRef}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              inputProps={{
                                step: 600, // 5 min
                              }}
                              fullWidth
                              name="startWork"
                              error={
                                touched.startWork && Boolean(errors.startWork)
                              }
                              helperText={touched.startWork && errors.startWork}
                              variant="outlined"
                              margin="dense"
                              className={classes.textField}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} xl={6}>
                            <Field
                              as={TextField}
                              label={i18n.t("userModal.form.endWork")}
                              type="time"
                              ampm={"false"}
                              inputRef={endWorkRef}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              inputProps={{
                                step: 600, // 5 min
                              }}
                              fullWidth
                              name="endWork"
                              error={touched.endWork && Boolean(errors.endWork)}
                              helperText={touched.endWork && errors.endWork}
                              variant="outlined"
                              margin="dense"
                              className={classes.textField}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />

                    <Field
                      as={TextField}
                      label={i18n.t("userModal.form.farewellMessage")}
                      type="farewellMessage"
                      multiline
                      rows={4}
                      fullWidth
                      name="farewellMessage"
                      error={
                        touched.farewellMessage &&
                        Boolean(errors.farewellMessage)
                      }
                      helperText={
                        touched.farewellMessage && errors.farewellMessage
                      }
                      variant="outlined"
                      margin="dense"
                    />

                    <Grid container spacing={1}>
                      <Grid item xs={12} md={6} xl={6}>
                        <FormControl
                          variant="outlined"
                          className={classes.maxWidth}
                          margin="dense"
                          fullWidth
                        >
                          <>
                            <InputLabel>
                              {i18n.t("userModal.form.defaultTheme")}
                            </InputLabel>

                            <Field
                              as={Select}
                              label={i18n.t("userModal.form.defaultTheme")}
                              name="defaultTheme"
                              type="defaultTheme"
                              required
                            >
                              <MenuItem value="light">
                                {i18n.t("userModal.form.defaultThemeLight")}
                              </MenuItem>
                              <MenuItem value="dark">
                                {i18n.t("userModal.form.defaultThemeDark")}
                              </MenuItem>
                            </Field>
                          </>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} xl={6}>
                        <FormControl
                          variant="outlined"
                          className={classes.maxWidth}
                          margin="dense"
                          fullWidth
                        >
                          <>
                            <InputLabel>
                              {i18n.t("userModal.form.defaultMenu")}
                            </InputLabel>

                            <Field
                              as={Select}
                              label={i18n.t("userModal.form.defaultMenu")}
                              name="defaultMenu"
                              type="defaultMenu"
                              required
                            >
                              <MenuItem value={"open"}>
                                {i18n.t("userModal.form.defaultMenuOpen")}
                              </MenuItem>
                              <MenuItem value={"closed"}>
                                {i18n.t("userModal.form.defaultMenuClosed")}
                              </MenuItem>
                            </Field>
                          </>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  <TabPanel
                    className={classes.container}
                    value={tab}
                    name={"permissions"}
                  >
                    <Can
                      role={loggedInUser.profile}
                      perform="user-modal:editProfile"
                      yes={() => (
                        <>
                          <Grid container spacing={1}>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allTicket")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t("userModal.form.allTicket")}
                                    name="allTicket"
                                    type="allTicket"
                                    required
                                  >
                                    <MenuItem value="enable">
                                      {i18n.t("userModal.form.allTicketEnable")}
                                    </MenuItem>
                                    <MenuItem value="disable">
                                      {i18n.t(
                                        "userModal.form.allTicketDisable"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allowGroup")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t("userModal.form.allowGroup")}
                                    name="allowGroup"
                                    type="allowGroup"
                                    required
                                  >
                                    <MenuItem value={true}>
                                      {i18n.t("userModal.form.allTicketEnable")}
                                    </MenuItem>
                                    <MenuItem value={false}>
                                      {i18n.t(
                                        "userModal.form.allTicketDisable"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Grid container spacing={1}>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allHistoric")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t("userModal.form.allHistoric")}
                                    name="allHistoric"
                                    type="allHistoric"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allUserChat")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t("userModal.form.allUserChat")}
                                    name="allUserChat"
                                    type="allUserChat"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Grid container spacing={1}>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t(
                                      "userModal.form.userClosePendingTicket"
                                    )}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t(
                                      "userModal.form.userClosePendingTicket"
                                    )}
                                    name="userClosePendingTicket"
                                    type="userClosePendingTicket"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allowConnections")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t(
                                      "userModal.form.allowConnections"
                                    )}
                                    name="allowConnections"
                                    type="allowConnections"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Grid container spacing={1}>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.showDashboard")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t(
                                      "userModal.form.showDashboard"
                                    )}
                                    name="showDashboard"
                                    type="showDashboard"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6} xl={6}>
                              <FormControl
                                variant="outlined"
                                className={classes.maxWidth}
                                margin="dense"
                                fullWidth
                              >
                                <>
                                  <InputLabel>
                                    {i18n.t("userModal.form.allowRealTime")}
                                  </InputLabel>

                                  <Field
                                    as={Select}
                                    label={i18n.t(
                                      "userModal.form.allowRealTime"
                                    )}
                                    name="allowRealTime"
                                    type="allowRealTime"
                                    required
                                  >
                                    <MenuItem value="disabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricDisabled"
                                      )}
                                    </MenuItem>
                                    <MenuItem value="enabled">
                                      {i18n.t(
                                        "userModal.form.allHistoricEnabled"
                                      )}
                                    </MenuItem>
                                  </Field>
                                </>
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} md={6} xl={6}>
                            <FormControl
                              variant="outlined"
                              className={classes.maxWidth}
                              margin="dense"
                              fullWidth
                            >
                              <>
                                <InputLabel>
                                  {"Ver Contatos"}
                                </InputLabel>

                                <Field
                                  as={Select}
                                  label={"Ver Contatos"}
                                  name="allowContacts"
                                  type="allowContacts"
                                  required
                                >
                                  <MenuItem value="disabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricDisabled"
                                    )}
                                  </MenuItem>
                                  <MenuItem value="enabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricEnabled"
                                    )}
                                  </MenuItem>
                                </Field>
                              </>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6} xl={6}>
                            <FormControl
                              variant="outlined"
                              className={classes.maxWidth}
                              margin="dense"
                              fullWidth
                            >
                              <>
                                <InputLabel>
                                  {"Ver Kanban"}
                                </InputLabel>

                                <Field
                                  as={Select}
                                  label={"Ver Kanban"}
                                  name="allowKanban"
                                  type="allowKanban"
                                  required
                                >
                                  <MenuItem value="disabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricDisabled"
                                    )}
                                  </MenuItem>
                                  <MenuItem value="enabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricEnabled"
                                    )}
                                  </MenuItem>
                                </Field>
                              </>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6} xl={6}>
                            <FormControl
                              variant="outlined"
                              className={classes.maxWidth}
                              margin="dense"
                              fullWidth
                            >
                              <>
                                <InputLabel>
                                  {"Ver Campanhas"}
                                </InputLabel>

                                <Field
                                  as={Select}
                                  label={"Ver Campanhas"}
                                  name="allowCampaigns"
                                  type="allowCampaigns"
                                  required
                                >
                                  <MenuItem value="disabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricDisabled"
                                    )}
                                  </MenuItem>
                                  <MenuItem value="enabled">
                                    {i18n.t(
                                      "userModal.form.allHistoricEnabled"
                                    )}
                                  </MenuItem>
                                </Field>
                              </>
                            </FormControl>
                          </Grid>
                        </>
                      )}
                    />
                  </TabPanel>
                </DialogContent>
              </Paper>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("userModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {userId
                    ? `${i18n.t("userModal.buttons.okEdit")}`
                    : `${i18n.t("userModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default UserModal;
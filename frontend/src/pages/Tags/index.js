import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
} from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useTheme } from "@mui/material";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Chip, Tooltip, Grid } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { MoreHoriz } from "@material-ui/icons";
import ContactTagListModal from "../../components/ContactTagListModal";

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_TAGS":
      return [...state, ...action.payload];
    case "UPDATE_TAGS":
      const tag = action.payload;
      const tagIndex = state.findIndex((s) => s.id === tag.id);

      if (tagIndex !== -1) {
        state[tagIndex] = tag;
        return [...state];
      } else {
        return [tag, ...state];
      }
    case "DELETE_TAGS":
      const tagId = action.payload;
      return state.filter((tag) => tag.id !== tagId);
    case "RESET":
      return [];
    default:
      return state;
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  iconButton: {
    backgroundColor: `${theme.palette.primary.main}15`, // Cor de fundo com transparência
    borderRadius: "50%", // Deixa o ícone com borda arredondada
    padding: "10px", // Tamanho do fundo
    marginRight: "4px", // Separação entre os ícones (ajuste conforme necessário)
    "&:hover": {
      backgroundColor: `${theme.palette.primary.main}25`, // Escurece o fundo ao passar o mouse
      boxShadow: `0 4px 6px rgba(${parseInt(theme.palette.primary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.primary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.2)`, // Sombra com a cor primária
    },
  },

  iconButtonDelete: {
    backgroundColor: `${theme.palette.primary.main}15`, // Cor de fundo com transparência
    borderRadius: "50%", // Deixa o ícone com borda arredondada
    padding: "10px", // Tamanho do fundo
    marginLeft: "4px", // Separação entre os ícones (ajuste conforme necessário)
    "&:hover": {
      backgroundColor: `${theme.palette.primary.main}25`, // Escurece o fundo ao passar o mouse
      boxShadow: `0 4px 6px rgba(${parseInt(theme.palette.primary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.primary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.2)`, // Sombra com a cor primária
    },
  },

  button: {
    borderRadius: "25px", // Aumenta o arredondamento do botão
    padding: "10px 20px", // Ajuste o padding para deixar o botão mais espaçado, se necessário
  },
}));

const Tags = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { user, socket } = useContext(AuthContext);

  const [selectedTagContacts, setSelectedTagContacts] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTagName, setSelectedTagName] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const pageNumberRef = useRef(1);

  useEffect(() => {
    const fetchMoreTags = async () => {
      try {
        const { data } = await api.get("/tags/", {
          params: { searchParam, pageNumber, kanban: 0 },
        });
        dispatch({ type: "LOAD_TAGS", payload: data.tags });
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        toastError(err);
      }
    };

    if (pageNumber > 0) {
      setLoading(true);
      fetchMoreTags();
    }
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const onCompanyTags = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_TAGS", payload: data.tag });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TAGS", payload: +data.tagId });
      }
    };
    socket.on(`company${user.companyId}-tag`, onCompanyTags);

    return () => {
      socket.off(`company${user.companyId}-tag`, onCompanyTags);
    };
  }, [socket, user.companyId]);

  const handleOpenTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(false);
  };

  const handleSearch = (event) => {
    const newSearchParam = event.target.value.toLowerCase();
    setSearchParam(newSearchParam);
    setPageNumber(1);
    dispatch({ type: "RESET" });
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
  };

  const handleShowContacts = (contacts, tag) => {
    setSelectedTagContacts(contacts);
    setContactModalOpen(true);
    setSelectedTagName(tag);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedTagContacts([]);
    setSelectedTagName("");
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success(i18n.t("tags.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingTag(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <MainContainer className={classes.mainContainer}>
      {contactModalOpen && (
        <ContactTagListModal
          open={contactModalOpen}
          onClose={handleCloseContactModal}
          tag={selectedTagName}
        />
      )}
      <ConfirmationModal
        title={deletingTag && `${i18n.t("tags.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tags.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <TagModal
        open={tagModalOpen}
        onClose={handleCloseTagModal}
        aria-labelledby="form-dialog-title"
        tagId={selectedTag && selectedTag.id}
        kanban={0}
      />
      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} sm={8} item>
            <Title>
              {i18n.t("tags.title")} ({tags.length})
            </Title>
          </Grid>
          <Grid xs={12} sm={4} item>
            <Grid spacing={2} container>
              <Grid xs={6} sm={6} item>
                <TextField
                  placeholder={i18n.t("contacts.searchPlaceholder")}
                  type="search"
                  value={searchParam}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon style={{ color: "gray" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid xs={6} sm={6} item>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleOpenTagModal}
                  className={classes.button} // Aplica a classe para personalizar o estilo
                >
                  {i18n.t("tags.buttons.add")}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {user.super && (
                <TableCell align="center">{i18n.t("tags.table.id")}</TableCell>
              )}{" "}
              {/* APENAS SUPER PODE VER O ID  */}
              <TableCell align="center">{i18n.t("tags.table.name")}</TableCell>
              <TableCell align="center">
                {i18n.t("tags.table.contacts")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("tags.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  {user.super && <TableCell align="center">{tag.id}</TableCell>}
                  <TableCell align="center">
                    <Chip
                      variant="outlined"
                      className={classes.backgroundDark}
                      label={tag.name}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {tag?.contacts?.length}
                    <IconButton
                      size="small"
                      onClick={() => handleShowContacts(tag?.contacts, tag)}
                      disabled={tag?.contacts?.length === 0}
                    >
                      <MoreHoriz />
                    </IconButton>
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEditTag(tag)}
                      className={classes.iconButton} // Aplica a classe
                    >
                      <EditIcon style={{ color: theme.palette.primary.main }} />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setConfirmModalOpen(true);
                        setDeletingTag(tag);
                      }}
                      className={classes.iconButtonDelete} // Aplica a classe
                    >
                      <DeleteOutlineIcon
                        style={{ color: theme.palette.error.main }}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {loading && <TableRowSkeleton key="skeleton" columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Tags;
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  makeStyles,
  useTheme,
  createTheme,
  ThemeProvider,
} from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from "react-trello";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from "react-router-dom";
import {
  Facebook,
  Instagram,
  WhatsApp,
  AttachMoney,
  LocalOffer,
  ViewColumn,
  FilterList,
  CalendarToday,
  Refresh,
  CompareArrows,
  MoreVert,
  ArrowDropDown,
  DragIndicator,
  Edit,
  Close,
  SaveAlt as Save,
  Message,
} from "@material-ui/icons";
import {
  Badge,
  Tooltip,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Avatar,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import { Can } from "../../components/Can";
import TicketEditModal from "../../components/TicketEditModal";
import InputAdornment from "@material-ui/core/InputAdornment";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import { debounce } from "lodash";
import styled from "@emotion/styled";
import ForbiddenPage from "../../components/ForbiddenPage";


const defaultTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      dark: "#115293",
    },
    success: {
      main: "#4caf50",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.54)",
    },
    divider: "rgba(0,0,0,0.12)",
  },
  spacing: (factor) => `${8 * factor}px`,
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    overflow: "hidden",
  },
  headerContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "12px 16px",
  },
  statsCard: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    backgroundColor: "#f8f8f8",
    padding: "8px 16px",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.05)",
  },
  filterContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    alignItems: "center",
  },
  filterInput: {
    "& .MuiOutlinedInput-root": {
      height: "36px",
      backgroundColor: "#ffffff",
    },
  },
  legendContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.75rem",
    color: "#666",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "12px",
    margin: "8px 0",
    border: "1px solid rgba(0,0,0,0.08)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  cardContact: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  cardValue: {
    color: "#4caf50",
    fontWeight: 500,
    fontSize: "0.9rem",
  },
  cardTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  statusChip: {
    borderRadius: "12px",
    padding: "2px 8px",
    fontSize: "0.75rem",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    display: "inline-flex",
    alignItems: "center",
  },
  adminChip: {
    backgroundColor: "#2196f3",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
  },
  dateSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dateInput: {
    "& .MuiInputBase-root": {
      height: "36px",
      fontSize: "0.9rem",
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: "4px",
      backgroundColor: "#fff",
    },
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    height: "36px",
    "&:hover": {
      backgroundColor: "#43A047",
    },
  },
  columnsButton: {
    backgroundColor: "#1976D2",
    color: "#fff",
    height: "36px",
    "&:hover": {
      backgroundColor: "#1565C0",
    },
  },
}));

const getBackgroundColor = (value) => {
  const numValue = parseFloat(value);
  if (!numValue) return "#f5f5f5";
  if (numValue <= 100) return "#e3f2fd";
  if (numValue <= 500) return "#fff3e0";
  if (numValue <= 1000) return "#fff9c4";
  return "#f3e5f5";
};

const MessagesModal = ({ open, onClose, ticket }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  
  const fetchMessages = async () => {
    if (!ticket?.id) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${ticket.id}`);
      console.log("Dados recebidos:", data);

      if (data && Array.isArray(data)) {
        setMessages(data);
      } else if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticket?.id) {
      fetchMessages();
    }
  }, [open, ticket]);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography>Mensagens - {ticket?.contact?.number}</Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent
          style={{
            padding: 0,
            height: "60vh",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              height: "100%",
              overflowY: "auto",
              padding: "16px",
              backgroundColor: "#f5f5f5",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography>Carregando mensagens...</Typography>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    margin: "8px",
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: message.fromMe ? "#dcf8c6" : "#fff",
                    marginLeft: message.fromMe ? "auto" : "8px",
                    marginRight: message.fromMe ? "8px" : "auto",
                    maxWidth: "80%",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                  }}
                >
                  <Typography variant="body2">{message.body}</Typography>
                  <Typography
                    variant="caption"
                    style={{
                      color: "#666",
                      display: "block",
                      textAlign: "right",
                      marginTop: 4,
                    }}
                  >
                    {format(parseISO(message.createdAt), "HH:mm")}
                  </Typography>
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography>Nenhuma mensagem encontrada</Typography>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

// Função auxiliar para limitar texto
const truncateText = (text, limit) => {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};

const CardContainer = styled.div`
  background-color: ${(props) => getBackgroundColor(props.value)};
  border-radius: 8px;
  padding: 12px;
  margin: 8px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TicketCard = ({
  id,
  tickets,
  classes,
  handleCardClick,
  IconChannel,
  fetchTickets,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const ticket = tickets.find((t) => t?.id?.toString() === id);
  const { user } = useContext(AuthContext);

  if (!ticket) return null;

  return (
    <CardContainer
      value={ticket.value}
      style={{
        border: ticket.userId !== user.id ? "2px solid #1976d2" : "none",
        position: "relative",
      }}
    >
      {/* Cabeçalho com nome e informações */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          paddingBottom: "8px",
        }}
      >
        {/* Data e Hora */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "0.75rem",
            color: "#666",
            marginBottom: "4px",
          }}
        >
          {isSameDay(parseISO(ticket.createdAt), new Date()) ? (
            <span>Hoje às {format(parseISO(ticket.createdAt), "HH:mm")}</span>
          ) : (
            <span>
              {format(parseISO(ticket.createdAt), "dd/MM/yyyy HH:mm")}
            </span>
          )}
        </div>

        {/* Nome e avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Tooltip title={ticket.whatsapp?.name || ""}>
            {IconChannel(ticket.channel)}
          </Tooltip>
          <Avatar
            src={ticket.contact?.urlPicture}
            alt={ticket.contact?.name}
            style={{
              width: 32,
              height: 32,
              marginRight: 8,
              backgroundColor: ticket.contact?.urlPicture
                ? "transparent"
                : "#1976d2",
            }}
          >
            {!ticket.contact?.urlPicture && ticket.contact?.name?.charAt(0)}
          </Avatar>
          <Typography
            style={{
              fontSize: "0.9rem",
              color: "#000000",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "200px",
            }}
          >
            {truncateText(ticket.contact?.name || ticket.contact?.number, 25)}
          </Typography>
        </div>

        {/* Tag de ATENDIMENTO em nova linha */}
        {ticket.queue?.name && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: "40px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.7rem",
                color: "#666",
              }}
            >
              <span>• {ticket.queue.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Valor e SKU */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <AttachMoney style={{ color: "#4caf50", fontSize: "16px" }} />
          <Typography
            style={{
              color: "#4caf50",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {Number(ticket.value || 0).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </Typography>
        </div>
        {ticket.productSku && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#757575",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              color: "#fff",
            }}
          >
            <LocalOffer fontSize="small" style={{ fontSize: "0.75rem" }} />
            <span>{ticket.productSku}</span>
          </div>
        )}
      </div>

      {/* Footer com status e ações */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingTop: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#4caf50",
            }}
          />
          <Typography
            style={{
              fontSize: "0.75rem",
              color: "#2e7d32",
              fontWeight: 500,
            }}
          >
            Aberto
          </Typography>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleCardClick(ticket.uuid)}
            style={{
              backgroundColor: "#1976d2",
              color: "#fff",
              fontSize: "0.75rem",
              padding: "4px 8px",
              minWidth: "auto",
              textTransform: "none",
            }}
          >
            Abrir
          </Button>

          <IconButton
            size="small"
            onClick={() => setMessagesModalOpen(true)}
            style={{
              padding: 4,
              backgroundColor: "#e3f2fd",
              color: "#1976d2",
            }}
          >
            <Message style={{ fontSize: "0.9rem" }} />
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditModalOpen(true);
            }}
            style={{
              padding: 4,
              backgroundColor: "#f5f5f5",
            }}
          >
            <Edit style={{ fontSize: "0.9rem" }} />
          </IconButton>

          <Chip
            size="small"
            label={ticket.user?.name || "Sem responsável"}
            style={{
              backgroundColor: ticket.user?.name ? "#e3f2fd" : "#f5f5f5",
              color: ticket.user?.name ? "#1976d2" : "#666",
              height: "20px",
              fontSize: "0.7rem",
            }}
          />
        </div>
      </div>

      <MessagesModal
        open={messagesModalOpen}
        onClose={() => setMessagesModalOpen(false)}
        ticket={ticket}
      />
      <TicketEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        ticket={ticket}
        onUpdate={fetchTickets}
      />
    </CardContainer>
  );
};

const LaneHeader = (props) => {
  // Verifica se é a coluna padrão (Em aberto)
  const isDefaultLane = props.title === i18n.t("tagsKanban.laneDefault");

  // Calcula o valor total dos cards na lane
  const totalValue = props.cards?.reduce((sum, card) => {
    return sum + (Number(card.value) || 0);
  }, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "12px 16px",
        backgroundColor: props.style?.backgroundColor || "#f8f9fa",
        borderRadius: "8px 8px 0 0",
        color: isDefaultLane ? "#000000" : props.style?.color || "#fff",
      }}
    >
      {/* Cabeçalho com título e contagem */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography
            style={{
              fontWeight: 500,
              fontSize: "0.9rem",
              color: isDefaultLane ? "#000000" : "inherit",
            }}
          >
            {props.title}
          </Typography>
          <div
            style={{
              backgroundColor: isDefaultLane
                ? "rgba(0,0,0,0.1)"
                : "rgba(255,255,255,0.2)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              color: isDefaultLane ? "#000000" : "inherit",
            }}
          >
            {props.label}
          </div>
        </div>
        <IconButton
          size="small"
          style={{
            color: isDefaultLane ? "#000000" : "inherit",
            padding: 4,
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </div>

      {/* Valor total da lane */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "0.75rem",
          color: isDefaultLane ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
        }}
      >
        <AttachMoney style={{ fontSize: "0.9rem" }} />
        <Typography style={{ fontSize: "0.75rem" }}>
          Total: R${" "}
          {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Typography>
      </div>
    </div>
  );
};

const laneStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 8px",
  minWidth: "300px",
  padding: 0,
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const laneColors = {
  "Em aberto": "#f5f5f5",
  "EM NEGOCIAÇÃO": "#9c27b0",
  "FOLLOW UP": "#ffc107",
  "LEAD QUALIFICADO": "#2196f3",
  VENDA: "#4caf50",
};

const KanbanHeader = ({
  date,
  handleDateChange,
  handleAddConnectionClick,
  tickets,
  showAllCards,
  setShowAllCards,
}) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const totalValue = tickets.reduce((sum, ticket) => {
    return sum + (Number(ticket.value) || 0);
  }, 0);

  const totalCards = tickets.length;

  // Calcula estatísticas para todos os tickets da companhia
  const allTicketsByUser = tickets.reduce((acc, ticket) => {
    const userName = ticket.user?.name || "Sem responsável";
    if (!acc[userName]) {
      acc[userName] = {
        count: 0,
        value: 0,
      };
    }
    acc[userName].count += 1;
    acc[userName].value += Number(ticket.value) || 0;
    return acc;
  }, {});

  // Ordena os usuários: primeiro os com responsável, depois "Sem responsável"
  const sortedUsers = Object.entries(allTicketsByUser).sort((a, b) => {
    if (a[0] === "Sem responsável") return 1;
    if (b[0] === "Sem responsável") return -1;
    return b[1].count - a[1].count;
  });

  return (
    <Paper elevation={0} className={classes.headerContainer}>
      <div className={classes.headerContent}>
        {/* Primeira linha */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: "16px",
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: "8px",
                padding: "8px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <CalendarToday
                fontSize="small"
                style={{ color: "#1976d2", marginRight: "8px" }}
              />
              <TextField
                type="date"
                value={date}
                onChange={handleDateChange}
                variant="standard"
                size="small"
                InputProps={{ disableUnderline: true }}
                style={{ width: "130px" }}
              />
            </div>

            {user.profile === "admin" && (
              <FormControlLabel
                control={
                  <Switch
                    checked={showAllCards}
                    onChange={(e) => setShowAllCards(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography style={{ fontSize: "0.9rem", color: "#666" }}>
                    Visualizar cards de todos os usuários
                  </Typography>
                }
              />
            )}
          </div>

          <Button
            variant="contained"
            onClick={handleAddConnectionClick}
            startIcon={<ViewColumn />}
            style={{
              backgroundColor: "#1976d2",
              color: "#fff",
              height: "40px",
              boxShadow: "0 2px 4px rgba(25,118,210,0.2)",
            }}
          >
            COLUNAS
          </Button>
        </div>

        {/* Segunda linha - Cards de estatísticas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            width: "100%",
            padding: "16px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Paper
            elevation={0}
            style={{
              padding: "16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <Typography
              variant="caption"
              style={{ color: "#666", fontSize: "0.75rem" }}
            >
              TOTAL EM NEGOCIAÇÃO
            </Typography>
            <Typography
              variant="h5"
              style={{ color: "#4caf50", fontWeight: "600", marginTop: "4px" }}
            >
              {`R$ ${totalValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            style={{
              padding: "16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <Typography
              variant="caption"
              style={{ color: "#666", fontSize: "0.75rem" }}
            >
              TOTAL DE CARDS
            </Typography>
            <Typography
              variant="h5"
              style={{ color: "#1976d2", fontWeight: "600", marginTop: "4px" }}
            >
              {totalCards}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            style={{
              padding: "16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              gridColumn: "1 / -1",
            }}
          >
            <Typography
              variant="caption"
              style={{
                color: "#666",
                fontSize: "0.75rem",
                marginBottom: "8px",
                display: "block",
              }}
            >
              DISTRIBUIÇÃO POR USUÁRIO
            </Typography>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {sortedUsers.map(([userName, stats]) => (
                <Chip
                  key={userName}
                  size="small"
                  label={`${userName}: ${
                    stats.count
                  } (R$ ${stats.value.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })})`}
                  style={{
                    backgroundColor:
                      userName === "Sem responsável" ? "#f5f5f5" : "#e3f2fd",
                    color: userName === "Sem responsável" ? "#666" : "#1976d2",
                    height: "24px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    border:
                      userName === user.name ? "2px solid #1976d2" : "none",
                  }}
                />
              ))}
            </div>
          </Paper>
        </div>
      </div>
    </Paper>
  );
};

const KanbanFilters = ({ onFilter }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [sku, setSku] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);

  // Busca usuários e filas ao montar o componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users");
        setUsers(data.users);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        toast.error("Erro ao carregar lista de usuários");
      }
    };

    const fetchQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        console.error("Erro ao buscar departamentos:", err);
        toast.error("Erro ao carregar lista de departamentos");
      }
    };

    fetchUsers();
    fetchQueues();
  }, [user.companyId]);

  const debouncedFilter = debounce((filters) => {
    onFilter(filters);
  }, 300);

  const handleFilter = () => {
    debouncedFilter({
      minValue: minValue ? Number(minValue) : null,
      maxValue: maxValue ? Number(maxValue) : null,
      sku: sku.trim(),
      userId: selectedUser,
      queueId: selectedQueue,
    });
  };

  const handleClearFilters = () => {
    setMinValue("");
    setMaxValue("");
    setSku("");
    setSelectedUser("");
    setSelectedQueue("");
    debouncedFilter({
      minValue: null,
      maxValue: null,
      sku: "",
      userId: "",
      queueId: "",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Faixas de valor */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
        }}
      >
        <Typography
          variant="caption"
          style={{ color: "#666", fontWeight: 500, marginRight: "8px" }}
        >
          FAIXAS DE VALOR:
        </Typography>
        <Chip
          size="small"
          label="Sem valor"
          style={{ backgroundColor: "#f5f5f5", height: "24px" }}
        />
        <Chip
          size="small"
          label="Até R$ 100"
          style={{ backgroundColor: "#e3f2fd", height: "24px" }}
        />
        <Chip
          size="small"
          label="R$ 101 até R$ 500"
          style={{ backgroundColor: "#fff3e0", height: "24px" }}
        />
        <Chip
          size="small"
          label="R$ 501 até R$ 1.000"
          style={{ backgroundColor: "#fff9c4", height: "24px" }}
        />
        <Chip
          size="small"
          label="Acima de R$ 1.000"
          style={{ backgroundColor: "#f3e5f5", height: "24px" }}
        />
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          variant="outlined"
          label="Valor Mínimo"
          type="number"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">R$</InputAdornment>
            ),
          }}
          style={{ width: "150px" }}
        />
        <TextField
          size="small"
          variant="outlined"
          label="Valor Máximo"
          type="number"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">R$</InputAdornment>
            ),
          }}
          style={{ width: "150px" }}
        />
        <TextField
          size="small"
          variant="outlined"
          label="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          style={{ width: "150px" }}
        />
        <FormControl
          variant="outlined"
          size="small"
          style={{ minWidth: "200px" }}
        >
          <InputLabel>Usuário</InputLabel>
          <Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            label="Usuário"
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="unassigned">Sem responsável</MenuItem>
            {users.length > 0 &&
              users.map((user, index) => (
                <MenuItem dense key={index} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <FormControl
          variant="outlined"
          size="small"
          style={{ minWidth: "200px" }}
        >
          <InputLabel>Departamento</InputLabel>
          <Select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            label="Departamento"
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {queues.map((queue) => (
              <MenuItem key={queue.id} value={queue.id}>
                {queue.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            startIcon={<Close />}
            style={{
              borderColor: "#666",
              color: "#666",
            }}
          >
            Limpar
          </Button>
          <Button
            variant="contained"
            startIcon={<FilterList />}
            onClick={handleFilter}
            style={{
              backgroundColor: "#1976d2",
              color: "#fff",
            }}
          >
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
};

const Kanban = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { user: loggedInUser } = useContext(AuthContext);
  console.log(loggedInUser);
  const { user, socket } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [file, setFile] = useState({ lanes: [] });
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filters, setFilters] = useState({
    minValue: null,
    maxValue: null,
    sku: "",
    userId: "",
    queueId: "",
  });
  const [showAllCards, setShowAllCards] = useState(false);

  const jsonString = user.queues.map((queue) => queue.UserQueue.queueId);

  useEffect(() => {
    fetchTags();
  }, [user]);

  const fetchTags = async () => {
    try {
      const response = await api.get("/tag/kanban/");
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString),
          startDate: startDate,
          endDate: endDate,
        },
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      setTickets([]);
      setFilteredTickets([]);
    }
  };

  useEffect(() => {
    const companyId = user.companyId;
    const onAppMessage = (data) => {
      if (
        data.action === "create" ||
        data.action === "update" ||
        data.action === "delete"
      ) {
        fetchTickets();
      }
    };
    socket.on(`company-${companyId}-ticket`, onAppMessage);
    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      socket.off(`company-${companyId}-ticket`, onAppMessage);
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [socket, startDate, endDate]);

  const handleSearchClick = () => {
    fetchTickets();
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook":
        return (
          <Facebook
            style={{
              color: "#3b5998",
              verticalAlign: "middle",
              fontSize: "16px",
            }}
          />
        );
      case "instagram":
        return (
          <Instagram
            style={{
              color: "#e1306c",
              verticalAlign: "middle",
              fontSize: "16px",
            }}
          />
        );
      case "whatsapp":
        return (
          <WhatsApp
            style={{
              color: "#25d366",
              verticalAlign: "middle",
              fontSize: "16px",
            }}
          />
        );
      default:
        return "error";
    }
  };

  const popularCards = (jsonString) => {
    const ticketsToUse = filteredTickets.length > 0 ? filteredTickets : tickets;
    const filteredByTags = ticketsToUse.filter(
      (ticket) => ticket.tags.length === 0
    );

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredByTags.length.toString(),
        style: {
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          minWidth: "300px",
          maxHeight: "calc(100vh - 300px)",
          overflowY: "auto",
        },
        cards: filteredByTags.map((ticket) => ({
          id: ticket.id.toString(),
          label: "Ticket nº " + ticket.id.toString(),
          productSku: ticket.productSku,
          value: ticket.value,
          description: (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>{ticket.contact.number}</span>
                <Typography
                  className={
                    Number(ticket.unreadMessages) > 0
                      ? classes.unreadBadge
                      : classes.messageTime
                  }
                  component="span"
                  variant="body2"
                >
                  {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                  ) : (
                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                  )}
                </Typography>
              </div>
              <div style={{ textAlign: "left" }}>
                {ticket.lastMessage || " "}
              </div>
              <Button
                className={`${classes.button} ${classes.cardButton}`}
                onClick={() => {
                  handleCardClick(ticket.uuid);
                }}
              >
                Ver Ticket
              </Button>
              <span style={{ marginRight: "8px" }} />
              {ticket?.user && (
                <Badge
                  style={{ backgroundColor: "#000000" }}
                  className={classes.connectionTag}
                >
                  {ticket.user?.name.toUpperCase()}
                </Badge>
              )}
            </div>
          ),
          title: (
            <>
              <Tooltip title={ticket.whatsapp?.name}>
                {IconChannel(ticket.channel)}
              </Tooltip>{" "}
              {ticket.contact.name}
            </>
          ),
          draggable: true,
          href: "/tickets/" + ticket.uuid,
        })),
      },
      ...tags.map((tag) => {
        const filteredTickets = ticketsToUse.filter((ticket) => {
          const tagIds = ticket.tags.map((tag) => tag.id);
          return tagIds.includes(tag.id);
        });

        return {
          id: tag.id.toString(),
          title: tag.name,
          label: filteredTickets?.length.toString(),
          style: {
            backgroundColor: tag.color || "#ffffff",
            color: "white",
            borderRadius: "8px",
            padding: "8px",
            minWidth: "300px",
            maxHeight: "calc(100vh - 300px)",
            overflowY: "auto",
          },
          cards: filteredTickets.map((ticket) => ({
            id: ticket.id.toString(),
            label: "Ticket nº " + ticket.id.toString(),
            productSku: ticket.productSku,
            value: ticket.value,
            description: (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>{ticket.contact.number}</span>
                  <Typography
                    className={
                      Number(ticket.unreadMessages) > 0
                        ? classes.unreadBadge
                        : classes.messageTime
                    }
                    component="span"
                    variant="body2"
                  >
                    {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                      <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                    ) : (
                      <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                    )}
                  </Typography>
                </div>
                <div style={{ textAlign: "left" }}>
                  {ticket.lastMessage || " "}
                </div>
                <Button
                  className={`${classes.button} ${classes.cardButton}`}
                  onClick={() => {
                    handleCardClick(ticket.uuid);
                  }}
                >
                  Ver Ticket
                </Button>
                <span style={{ marginRight: "8px" }} />
                {ticket?.user && (
                  <Badge
                    style={{ backgroundColor: "#000000" }}
                    className={classes.connectionTag}
                  >
                    {ticket.user?.name.toUpperCase()}
                  </Badge>
                )}
              </div>
            ),
            title: (
              <>
                <Tooltip title={ticket.whatsapp?.name}>
                  {IconChannel(ticket.channel)}
                </Tooltip>{" "}
                {ticket.contact.name}
              </>
            ),
            draggable: true,
            href: "/tickets/" + ticket.uuid,
          })),
        };
      }),
    ];

    setFile({ lanes });
  };

  const handleCardClick = (uuid) => {
    history.push("/tickets/" + uuid);
  };

  useEffect(() => {
    popularCards(jsonString);
  }, [tags, filteredTickets]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      await api.put(`/ticket-tags/${targetLaneId}/empty`);

      if (String(sourceLaneId) === "line0") {
        // Verifica se o card já está na lane de destino
        await api.delete(`/ticket-tags/${targetLaneId}`);
        await api.put(`/ticket-tags/${targetLaneId}/empty`);
      } else {
        await api.delete(`/ticket-tags/${targetLaneId}`);
        await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      }

      toast.success("Ticket Tag Adicionado com Sucesso!", {
        style: {
          borderRadius: "8px",
        },
      });

      setTimeout(() => {
        handleSearchClick();
      }, 300);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddConnectionClick = () => {
    history.push("/tagsKanban");
  };

  const applyFilters = (newFilters) => {
    console.log("newFilters", newFilters);
    setFilters(newFilters);
    let filtered = [...tickets];

    // Filtro de visualização baseado no perfil e companhia
    if (
      !user.profile === "admin" ||
      (user.profile === "admin" && !showAllCards)
    ) {
      filtered = filtered.filter(
        (ticket) => ticket.userId === user.id || !ticket.userId
      );
    } else if (user.profile === "admin" && showAllCards) {
      filtered = filtered.filter(
        (ticket) => ticket.companyId === user.companyId
      );
    }

    // Filtro por valor mínimo
    if (newFilters.minValue !== null) {
      filtered = filtered.filter(
        (ticket) => Number(ticket.value) >= newFilters.minValue
      );
    }

    // Filtro por valor máximo
    if (newFilters.maxValue !== null) {
      filtered = filtered.filter(
        (ticket) => Number(ticket.value) <= newFilters.maxValue
      );
    }

    // Filtro por SKU
    if (newFilters.sku) {
      filtered = filtered.filter((ticket) =>
        ticket.productSku?.toLowerCase().includes(newFilters.sku.toLowerCase())
      );
    }

    // Filtro por usuário
    if (newFilters.userId) {
      if (newFilters.userId === "unassigned") {
        filtered = filtered.filter((ticket) => !ticket.userId);
      } else {
        filtered = filtered.filter(
          (ticket) => ticket.userId === newFilters.userId
        );
      }
    }

    // Filtro por departamento (fila)
    if (newFilters.queueId) {
      filtered = filtered.filter(
        (ticket) => ticket.queueId === newFilters.queueId
      );
    }

    setFilteredTickets(filtered);
  };

  useEffect(() => {
    if (tickets.length > 0) {
      applyFilters(filters);
    }
  }, [tickets, showAllCards]);

  // CustomCard agora passa todas as props necessárias
  const CustomCard = React.memo(({ id }) => (
    <TicketCard
      id={id}
      tickets={tickets}
      classes={classes}
      handleCardClick={handleCardClick}
      IconChannel={IconChannel}
      fetchTickets={fetchTickets}
    />
  ));

  // Memoize o KanbanHeader
  const MemoizedKanbanHeader = React.memo(KanbanHeader);

  // Memoize o KanbanFilters
  const MemoizedKanbanFilters = React.memo(KanbanFilters);

  return (
    <ThemeProvider theme={defaultTheme}>
      {loggedInUser.profile === "user" &&
      loggedInUser.allowKanban === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <div className={classes.root}>
          <MemoizedKanbanHeader
            date={startDate}
            handleDateChange={handleStartDateChange}
            handleAddConnectionClick={handleAddConnectionClick}
            tickets={filteredTickets.length > 0 ? filteredTickets : tickets}
            showAllCards={showAllCards}
            setShowAllCards={setShowAllCards}
          />
          <MemoizedKanbanFilters onFilter={applyFilters} />
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: "20px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Board
              data={file}
              onCardMoveAcrossLanes={handleCardMove}
              style={{
                backgroundColor: "transparent",
                height: "calc(100vh - 250px)",
                minWidth: "fit-content",
              }}
              components={{
                Card: CustomCard,
                LaneHeader: LaneHeader,
              }}
              laneStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                margin: "0 8px",
                width: "300px",
                minWidth: "300px",
                maxWidth: "300px",
                padding: 0,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                height: "100%",
              }}
            />
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};

export default Kanban;

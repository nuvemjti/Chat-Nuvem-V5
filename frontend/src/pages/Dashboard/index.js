import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import CallIcon from "@material-ui/icons/Call";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import MessageIcon from "@material-ui/icons/Message";
import { SaveAlt } from "@mui/icons-material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Button,
  ButtonGroup,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { isArray, isEmpty } from "lodash";
import moment from "moment";
import { format, parseISO } from "date-fns";
import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  FunnelChart,
  Funnel,
} from "recharts";
import * as XLSX from "xlsx";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import useMessages from "../../hooks/useMessages";
import api from "../../services/api";
import CampaignIcon from "@mui/icons-material/Campaign";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useHistory } from "react-router-dom";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { debounce } from 'lodash/debounce';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CircularProgress } from "@mui/material";
import { CloudDownload } from "@mui/icons-material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PaidIcon from '@mui/icons-material/Paid';
import { DeleteOutline } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { TextField } from "@mui/material";

const API_KEY = 'SUA_API_KEY_DO_GOOGLE';
const SPREADSHEET_ID = '1DytSF_x5RHO-yIO9r2RkHhnDpbnWiNfJW4AxuLG46Tc';
const RANGE = 'A1:G1000'; // Ajuste o range conforme necessário

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { find } = useDashboard();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(
    moment().startOf("month").format("YYYY-MM-DD"),
  );
  const [dateEndTicket, setDateEndTicket] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [kanbanValues, setKanbanValues] = useState({
    totalValue: 0,
    averageTicket: 0,
    ticketCount: 0
  });
  const [campaignStats, setCampaignStats] = useState({
    active: 0,
    deliveryRate: 0
  });
  const history = useHistory();
  const [nextSchedules, setNextSchedules] = useState([]);
  const [salesProjection, setSalesProjection] = useState([
    { name: "Jan", previous: 0, current: 0 },
    { name: "Fev", previous: 0, current: 0 },
    { name: "Mar", previous: 0, current: 0 },
    { name: "Abr", previous: 0, current: 0 },
    { name: "Mai", previous: 0, current: 0 },
    { name: "Jun", previous: 0, current: 0 },
  ]);
  const [funnelData, setFunnelData] = useState([
    { name: "Contato Inicial", value: 0 },
    { name: "Proposta", value: 0 },
    { name: "Negociação", value: 0 },
    { name: "Fechamento", value: 0 }
  ]);
  const [colors, setColors] = useState(["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]);
  const [channelData, setChannelData] = useState([
    { name: 'WhatsApp', value: 0, color: '#25D366', percent: 0 }
//    { name: 'Facebook', value: 0, color: '#3b5998', percent: 0 },
//    { name: 'Instagram', value: 0, color: '#E1306C', percent: 0 }
  ]);
  const [campaignFunnelData, setCampaignFunnelData] = useState({
    // Dados do funil
    stages: [
      { 
        name: "Leads", 
        value: 0, 
        color: "#000000",
        icon: <PersonAddIcon sx={{ fontSize: 20 }} />
      },
      { 
        name: "MQLs", 
        value: 0, 
        color: "#1a237e",
        icon: <AssignmentIndIcon sx={{ fontSize: 20 }} />
      },
      { 
        name: "Agendamentos", 
        value: 0, 
        color: "#33691e",
        icon: <EventAvailableIcon sx={{ fontSize: 20 }} />
      },
      { 
        name: "Reuniões", 
        value: 0, 
        color: "#212121",
        icon: <GroupsIcon sx={{ fontSize: 20 }} />
      },
      { 
        name: "Compras", 
        value: 0, 
        color: "#9cff57",
        icon: <ShoppingCartIcon sx={{ fontSize: 20 }} />
      }
    ],
    // Métricas
    investimento: 0,
    faturamento: 0,
    roas: 0,
    taxaConversao: 0,
    ticketMedio: 0,
    cpl: 0,
    custoMql: 0,
    custoReuniao: 0,
    sqls: 0,
    cpa: 0
  });

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
      await fetchKanbanData();
      await fetchCampaignStats();
      await fetchNextSchedules();
      await fetchChannelData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
  }, []);

  // Função auxiliar para gerar dados do gráfico
  const generateChartData = (baseValue, variation = 0.1, points = 12) => {
    const result = [];
    let lastValue = baseValue;

    for (let i = 0; i < points; i++) {
      const change = (Math.random() * 2 - 1) * variation * baseValue;
      lastValue = Math.max(0, lastValue + change);
      result.push({ value: lastValue });
    }

    return result;
  };

  // Função para obter número de usuários ativos
  const GetUsers = () => {
    let count = 0;
    attendants.forEach((user) => {
      if (user.online === true) {
        count++;
      }
    });
    return count;
  };

  // Função para formatar tempo
  const formatTime = (minutes) => {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  };

  // Função para exportar para Excel
  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(
      document.getElementById("grid-attendants"),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
    XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
  };

  // Contagem das mensagens enviadas
  const { count: sentMessagesCount } = useMessages({
    fromMe: true, // Mensagens enviadas
    dateStart: dateStartTicket,
    dateEnd: dateEndTicket,
  });

  // Contagem das mensagens recebidas
  const { count: receivedMessagesCount } = useMessages({
    fromMe: false, // Mensagens recebidas
    dateStart: dateStartTicket,
    dateEnd: dateEndTicket,
  });

  // Garantir que os valores sejam números antes de somar
  const totalMessagesCount =
    (Number(sentMessagesCount) || 0) + (Number(receivedMessagesCount) || 0);

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
      params = {
        ...params,
        date_from: moment(dateStartTicket).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
      params = {
        ...params,
        date_to: moment(dateEndTicket).format("YYYY-MM-DD"),
      };
    }

    const data = await find(params);
    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }

    setLoading(false);
  }

  // Função para calcular projeção de vendas
  const calculateSalesProjection = () => {
    const currentMonth = moment().month();
    const previousMonthValue = kanbanValues.totalValue * 0.8; // Simulação de valor do mês anterior
    
    const newProjection = salesProjection.map((month, index) => {
      // Se for o mês atual, usamos os valores reais
      if (index === currentMonth) {
        return {
          ...month,
          current: kanbanValues.totalValue,
          previous: previousMonthValue
        };
      }
      // Para os outros meses, mantemos os valores existentes ou simulamos
      return month;
    });
    
    setSalesProjection(newProjection);
  };

  // Função para buscar dados do Kanban e montar o funil de vendas
  const fetchKanbanData = async () => {
    try {
      const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
      
      // Primeiro, buscamos os tickets do Kanban
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString || []),
          startDate: dateStartTicket || format(new Date(), "yyyy-MM-dd"),
          endDate: dateEndTicket || format(new Date(), "yyyy-MM-dd"),
        }
      });

      // Filtrar apenas tickets com valor maior que zero
      const validTickets = data?.tickets.filter(ticket => Number(ticket.value) > 0) || [];
      
      // Calcular valores considerando apenas tickets válidos
      const totalValue = validTickets.reduce((total, ticket) => total + (Number(ticket.value) || 0), 0);
      const ticketCount = validTickets.length;
      const averageTicket = ticketCount > 0 ? totalValue / ticketCount : 0;

      setKanbanValues({
        totalValue,
        averageTicket,
        ticketCount
      });
      
      // Buscar as tags do Kanban
      const tagsResponse = await api.get("/tags", {
        params: { kanban: 1 }
      });
      
      if (tagsResponse.data && Array.isArray(tagsResponse.data.tags)) {
        const kanbanTags = tagsResponse.data.tags;
        
        // Mapeamos as tags e calculamos os valores totais
        const funnelTagsData = kanbanTags
          .filter(tag => tag.ticketTags && tag.ticketTags.length > 0)
          .map(tag => {
            // Encontrar todos os tickets associados a esta tag
            const tagTickets = validTickets.filter(ticket => 
              ticket.tags?.some(t => t.id === tag.id)
            );
            
            // Calcular o valor total dos tickets desta tag
            const tagTotalValue = tagTickets.reduce((total, ticket) => 
              total + (Number(ticket.value) || 0), 0
            );
            
            return {
              name: tag.name,
              value: tag.ticketTags.length,
              totalValue: tagTotalValue,
              color: tag.color
            };
          })
          .sort((a, b) => b.value - a.value); // Mantém ordenado por quantidade de tickets
        
        console.log("Dados do funil com valores:", funnelTagsData);
        
        if (funnelTagsData.length > 0) {
          setFunnelData(funnelTagsData);
          setColors(funnelTagsData.map(tag => tag.color || "#8884d8"));
        }
      }
      
      calculateSalesProjection();
    } catch (error) {
      console.error("Erro ao buscar dados do Kanban:", error);
    }
  };

  const MetricCard = ({ title, value, trend, icon, chartData, color }) => {
    const trendIsPositive = parseFloat(trend) >= 0;

    return (
      <Card
        sx={{
          height: "100%",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
          borderRadius: "16px",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px 0 rgba(31,38,135,0.25)",
          },
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${color} 30%, ${color}99 90%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {value}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: trendIsPositive ? "success.main" : "error.main",
                    fontWeight: 500,
                  }}
                >
                  {trendIsPositive ? (
                    <ArrowUpward fontSize="small" />
                  ) : (
                    <ArrowDownward fontSize="small" />
                  )}
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            </Box>
            <Avatar
              sx={{
                bgcolor: `${color}15`,
                width: 56,
                height: 56,
                "& .MuiSvgIcon-root": {
                  color: color,
                  fontSize: 28,
                },
              }}
            >
              {icon}
            </Avatar>
          </Stack>
          <Box sx={{ mt: 3, height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id={`gradient-${title}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={`url(#gradient-${title})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const PerformanceCard = ({ title, value, max, color }) => {
    const percentage = (value / max) * 100;

    return (
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.primary" fontWeight="500">
            {percentage.toFixed(1)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: `${color}15`,
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
            },
          }}
        />
      </Box>
    );
  };

  const fetchCampaignStats = async () => {
    try {
      const { data } = await api.get("/campaigns/stats");
      setCampaignStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas da campanha:", error);
    }
  };

  // Função para buscar próximos agendamentos
  const fetchNextSchedules = async () => {
    try {
      const { data } = await api.get("/schedules", {
        params: { 
          pageNumber: 1,
          count: 5,
          searchParam: "",
          dateStart: moment().format("YYYY-MM-DD")
        }
      });
      
      // Ordena por data e seleciona os 5 primeiros
      const schedules = data.schedules || [];
      const sortedSchedules = schedules
        .sort((a, b) => moment(a.sendAt).diff(moment(b.sendAt)))
        .slice(0, 5);
      
      setNextSchedules(sortedSchedules);
    } catch (error) {
      console.error("Erro ao buscar próximos agendamentos:", error);
    }
  };

  // Função para buscar e calcular dados dos canais
  const fetchChannelData = async () => {
    try {
      const { data: tickets } = await api.get("/tickets", {
        params: {
          dateStart: dateStartTicket,
          dateEnd: dateEndTicket,
        },
      });

      const ticketsArray = Array.isArray(tickets) ? tickets : (tickets?.tickets || []);

      if (!Array.isArray(ticketsArray)) {
        console.error("Tickets não é um array:", ticketsArray);
        return;
      }

      // Contagem correta incluindo todos os tickets do WhatsApp (baileys)
      const whatsappCount = ticketsArray.filter(t => 
        t.channel === "whatsapp" || t.whatsapp?.name?.includes("baileys")
      ).length;
      
      const facebookCount = ticketsArray.filter(t => t.channel === "facebook").length;
      const instagramCount = ticketsArray.filter(t => t.channel === "instagram").length;

      const total = whatsappCount + facebookCount + instagramCount;

      console.log('Total de tickets:', {
        total,
        whatsapp: whatsappCount,
        facebook: facebookCount,
        instagram: instagramCount,
        tickets: ticketsArray.length
      });

      setChannelData([
        { name: `WhatsApp (${whatsappCount})`, value: whatsappCount, color: '#25D366', percent: total > 0 ? (whatsappCount / total) * 100 : 0, showInLegend: true }
//        { name: `Facebook (${facebookCount})`, value: facebookCount, color: '#3b5998', percent: total > 0 ? (facebookCount / total) * 100 : 0, showInLegend: true },
//        { name: `Instagram (${instagramCount})`, value: instagramCount, color: '#E1306C', percent: total > 0 ? (instagramCount / total) * 100 : 0, showInLegend: true }
      ]);
    } catch (err) {
      console.error("Erro ao buscar dados dos canais:", err);
    }
  };

  // Componente de filtro de período
const PeriodSelector = ({
  dateStartTicket,
  dateEndTicket,
  setDateStartTicket,
  setDateEndTicket,
  fetchData,
  fetchKanbanData,
  fetchCampaignStats,
  fetchNextSchedules,
  fetchChannelData
}) => {
  const setPeriod = (period) => {
    let start, end;

    switch (period) {
      case 'today':
        start = moment().startOf('day').format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      case 'week':
        start = moment().startOf('week').format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      case 'month':
        start = moment().startOf('month').format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      default:
        start = dateStartTicket;
        end = dateEndTicket;
    }

    setDateStartTicket(start);
    setDateEndTicket(end);

    fetchData();
    fetchKanbanData();
    fetchCampaignStats();
    fetchNextSchedules();
    fetchChannelData();
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
      <Button variant="outlined" size="small" onClick={() => setPeriod('today')} sx={{ borderRadius: '20px' }}>Hoje</Button>
      <Button variant="outlined" size="small" onClick={() => setPeriod('week')} sx={{ borderRadius: '20px' }}>Esta Semana</Button>
      <Button variant="outlined" size="small" onClick={() => setPeriod('month')} sx={{ borderRadius: '20px' }}>Este Mês</Button>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          type="date"
          size="small"
          value={dateStartTicket}
          onChange={(e) => setDateStartTicket(e.target.value)}
        />
        <TextField
          type="date"
          size="small"
          value={dateEndTicket}
          onChange={(e) => setDateEndTicket(e.target.value)}
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => setPeriod('custom')}
          sx={{ borderRadius: '20px' }}
        >
          Filtrar
        </Button>
      </Box>
    </Stack>
  );
};


  const prefetchData = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/api/data';
    document.head.appendChild(link);
  };

  const ImportButtons = () => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleFileSelect = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setIsLoading(true);
      try {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
          toast.error('Por favor, selecione um arquivo Excel ou CSV');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/campaigns/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data) {
          setCampaignFunnelData({
            stages: [
              { 
                name: "Leads", 
                value: response.data.leads || 0, 
                color: "#000000",
                icon: <PersonAddIcon sx={{ fontSize: 20 }} />
              },
              { 
                name: "MQLs", 
                value: response.data.mqls || 0, 
                color: "#1a237e",
                icon: <AssignmentIndIcon sx={{ fontSize: 20 }} />
              },
              { 
                name: "Agendamentos", 
                value: response.data.agendamentos || 0, 
                color: "#33691e",
                icon: <EventAvailableIcon sx={{ fontSize: 20 }} />
              },
              { 
                name: "Reuniões", 
                value: response.data.reunioes || 0, 
                color: "#212121",
                icon: <GroupsIcon sx={{ fontSize: 20 }} />
              },
              { 
                name: "Compras", 
                value: response.data.compras || 0, 
                color: "#9cff57",
                icon: <ShoppingCartIcon sx={{ fontSize: 20 }} />
              }
            ],
            investimento: response.data.investimento || 0,
            faturamento: response.data.faturamento || 0,
            roas: response.data.roas || 0,
            taxaConversao: response.data.taxaConversao || 0,
            ticketMedio: response.data.ticketMedio || 0,
            cpl: response.data.cpl || 0,
            custoMql: response.data.custoMql || 0,
            custoReuniao: response.data.custoReuniao || 0,
            sqls: response.data.sqls || 0,
            cpa: response.data.cpa || 0
          });

          toast.success('Dados importados com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        toast.error('Erro ao importar dados da planilha');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    return (
      <Box sx={{ 
        mt: 2, 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 2,
        borderRadius: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1 
          }}
        >
          <InfoIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          Importe sua planilha para atualizar o funil de campanhas
        </Typography>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          onClick={handleDownloadTemplate}
          startIcon={<DownloadIcon />}
          sx={{
            height: '40px',
            borderRadius: '8px',
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Baixar Modelo
        </Button>
        <Button
          variant="contained"
          onClick={handleImportClick}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <UploadFileIcon />}
          sx={{
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? 'Importando...' : 'Importar Planilha'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            if (window.confirm('Tem certeza que deseja limpar todos os dados do funil de campanhas?')) {
              handleClearData();
            }
          }}
          startIcon={<DeleteSweepIcon />}
          sx={{
            height: '40px',
            borderRadius: '8px',
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              borderColor: 'error.main',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Limpar Dados
        </Button>
      </Box>
    );
  };

  // Adicione a função para download do modelo
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Dados modelo atualizados para calcular todos os indicadores
    const templateData = [
      {
        'Data': '2024-03-14',
        'Status': 'Lead',
        'Origem': 'Facebook Ads',
        'Investimento': 100.00,
        'Nome': 'João Silva',
        'Email': 'joao@email.com',
        'Telefone': '11999999999',
        'Valor Venda': 0, // Para calcular faturamento
        'Qualificado MQL': 'Sim', // Para contagem de MQLs
        'Agendou Reunião': 'Sim', // Para contagem de agendamentos
        'Realizou Reunião': 'Não', // Para contagem de reuniões realizadas
        'Converteu Venda': 'Não', // Para identificar conversões
        'SQL': 'Não' // Para contagem de SQLs
      },
      {
        'Data': '2024-03-14',
        'Status': 'Compra',
        'Origem': 'Google Ads',
        'Investimento': 150.00,
        'Nome': 'Maria Santos',
        'Email': 'maria@email.com',
        'Telefone': '11988888888',
        'Valor Venda': 4200.00,
        'Qualificado MQL': 'Sim',
        'Agendou Reunião': 'Sim',
        'Realizou Reunião': 'Sim',
        'Converteu Venda': 'Sim',
        'SQL': 'Sim'
      }
    ];

    // Criar worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");

    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 12 }, // Data
      { wch: 12 }, // Status
      { wch: 15 }, // Origem
      { wch: 12 }, // Investimento
      { wch: 20 }, // Nome
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // Valor Venda
      { wch: 15 }, // Qualificado MQL
      { wch: 15 }, // Agendou Reunião
      { wch: 15 }, // Realizou Reunião
      { wch: 15 }, // Converteu Venda
      { wch: 12 }  // SQL
    ];

    // Download do arquivo
    XLSX.writeFile(wb, "modelo_importacao_campanhas.xlsx");
  };

  // Adicione a função para limpar os dados
  const handleClearData = async () => {
    try {
      const { data } = await api.delete('/campaigns/clear');
      
      // Atualiza o estado com os dados zerados
      setCampaignFunnelData({
        stages: [
          { 
            name: "Leads", 
            value: 0, 
            color: "#000000",
            icon: <PersonAddIcon sx={{ fontSize: 20 }} />
          },
          { 
            name: "MQLs", 
            value: 0, 
            color: "#1a237e",
            icon: <AssignmentIndIcon sx={{ fontSize: 20 }} />
          },
          { 
            name: "Agendamentos", 
            value: 0, 
            color: "#33691e",
            icon: <EventAvailableIcon sx={{ fontSize: 20 }} />
          },
          { 
            name: "Reuniões", 
            value: 0, 
            color: "#212121",
            icon: <GroupsIcon sx={{ fontSize: 20 }} />
          },
          { 
            name: "Compras", 
            value: 0, 
            color: "#9cff57",
            icon: <ShoppingCartIcon sx={{ fontSize: 20 }} />
          }
        ],
        investimento: 0,
        faturamento: 0,
        roas: 0,
        taxaConversao: 0,
        ticketMedio: 0,
        cpl: 0,
        custoMql: 0,
        custoReuniao: 0,
        sqls: 0,
        cpa: 0
      });

      toast.success('Dados do funil de campanhas limpos com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao limpar os dados do funil de campanhas');
    }
  };

  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <Box
          sx={{
            minHeight: "100vh",
            background: "#f5f5f5",
            py: 4,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Dashboard
              </Typography>
              <PeriodSelector
  dateStartTicket={dateStartTicket}
  dateEndTicket={dateEndTicket}
  setDateStartTicket={setDateStartTicket}
  setDateEndTicket={setDateEndTicket}
  fetchData={fetchData}
  fetchKanbanData={fetchKanbanData}
  fetchCampaignStats={fetchCampaignStats}
  fetchNextSchedules={fetchNextSchedules}
  fetchChannelData={fetchChannelData}
/>
            </Box>
            <Grid2 container spacing={3}>
              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Em Atendimento"
                  value={counters.supportHappening || 0}
                  trend={
                    counters.supportHappening > 0
                      ? (
                          ((counters.supportHappening -
                            counters.supportHappening) /
                            counters.supportHappening) *
                          100
                        ).toFixed(1)
                      : "0.0"
                  }
                  color={theme.palette.primary.main}
                  icon={<CallIcon />}
                  chartData={generateChartData(counters.supportHappening || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Aguardando"
                  value={counters.supportPending || 0}
                  trend={
                    counters.supportPending > 0
                      ? (
                          ((counters.supportPending -
                            (counters.supportPending || 0)) /
                            (counters.supportPending || 1)) *
                          100
                        ).toFixed(1)
                      : "0.0"
                  }
                  color={theme.palette.warning.main}
                  icon={<HourglassEmptyIcon />}
                  chartData={generateChartData(counters.supportPending || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Finalizados"
                  value={counters.supportFinished || 0}
                  trend={
                    counters.supportFinished > 0
                      ? (
                          ((counters.supportFinished -
                            counters.supportFinished) /
                            counters.supportFinished) *
                          100
                        ).toFixed(1)
                      : "0.0"
                  }
                  color={theme.palette.success.main}
                  icon={<CheckCircleIcon />}
                  chartData={generateChartData(counters.supportFinished || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total de Mensagens"
                  value={
                    <>
                      <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Total: {totalMessagesCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Enviadas: {sentMessagesCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Recebidas: {receivedMessagesCount}
                      </Typography>
                    </>
                  }
                  trend={
                    totalMessagesCount > 0
                      ? (
                          (sentMessagesCount / totalMessagesCount) *
                          100
                        ).toFixed(1)
                      : "0.0"
                  }
                  color={theme.palette.secondary.main}
                  icon={<MessageIcon />}
                  chartData={generateChartData(
                    sentMessagesCount,
                    receivedMessagesCount,
                  )}
                  style={{
                    padding: "16px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                />
              </Grid2>
            </Grid2>

            {/* Novos Cards - Valores do Kanban */}
            <Grid2 container spacing={3} sx={{ mt: 3 }}>
              <Grid2 xs={12} sm={6}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px 0 rgba(31,38,135,0.25)",
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Total em Negociação (Kanban)
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: "#4caf50" }}>
                          {kanbanValues.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {kanbanValues.ticketCount} tickets em negociação
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#4caf50",
                          height: 56,
                          width: 56,
                          borderRadius: 2,
                        }}
                      >
                        <AttachMoneyIcon sx={{ fontSize: 28 }}/>
                      </Avatar>
                    </Stack>
                    <Box sx={{ mt: 3, height: 60 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(kanbanValues.totalValue/1000, 0.05)}>
                          <defs>
                            <linearGradient
                              id="gradient-kanban-total"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#4caf50" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#4caf50" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#4caf50"
                            fill="url(#gradient-kanban-total)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} sm={6}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px 0 rgba(31,38,135,0.25)",
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Ticket Médio
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: "#ff9800" }}>
                          {kanbanValues.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Valor médio por negociação
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#ff9800",
                          height: 56,
                          width: 56,
                          borderRadius: 2,
                        }}
                      >
                        <ConfirmationNumberIcon sx={{ fontSize: 28 }}/>
                      </Avatar>
                    </Stack>
                    <Box sx={{ mt: 3, height: 60 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(kanbanValues.averageTicket/100, 0.1)}>
                          <defs>
                            <linearGradient
                              id="gradient-ticket-medio"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#ff9800" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#ff9800" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#ff9800"
                            fill="url(#gradient-ticket-medio)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Cards de Novos Contatos, Tickets Ativos e Passivos */}
            <Grid2 container spacing={3} sx={{ mt: 3 }}>
              <Grid2 xs={12} sm={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                  }}
                >
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Novos Contatos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.leads || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#8c6b19",
                          height: 45,
                          width: 45,
                        }}
                      >
                        <GroupAddIcon />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} sm={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                  }}
                >
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Tickets Ativos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.activeTickets || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#EE4512",
                          height: 45,
                          width: 45,
                        }}
                      >
                        <ArrowUpward />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} sm={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                  }}
                >
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Tickets Passivos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.passiveTickets || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#28C037",
                          height: 45,
                          width: 45,
                        }}
                      >
                        <ArrowDownward />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Card de Performance */}
            <Card
              sx={{
                mt: 4,
                borderRadius: "16px",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Desempenho
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {GetUsers()}/{attendants.length} atendentes ativos
                  </Typography>
                </Stack>

                <Grid2 container spacing={3}>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Taxa de Resolução"
                      value={counters.supportFinished || 0}
                      max={
                        counters.supportFinished + counters.supportPending || 1
                      }
                      color={theme.palette.primary.main}
                    />
                  </Grid2>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Tempo Médio de Resposta"
                      value={counters.avgResponseTime || 0}
                      max={counters.maxResponseTime || 60}
                      color={theme.palette.warning.main}
                    />
                  </Grid2>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Tempo Médio de Primeira Resposta"
                      value={formatTime(counters.avgFirstResponseTime || 0)}
                      max={60} // 60 minutos como meta
                      color={theme.palette.info.main}
                    />
                  </Grid2>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Taxa de Conversão (Leads → Vendas)"
                      value={(kanbanValues.totalValue > 0 && counters.leads > 0) ? 
                        (kanbanValues.ticketCount / counters.leads) * 100 : 0}
                      max={100}
                      color="#4caf50"
                    />
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <Grid2 container spacing={3} sx={{ mt: 2 }}>
              <Grid2 xs={12} lg={8}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Visão Geral de Atendimentos
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={[
                          {
                            date: new Date(),
                            atendimento: counters.supportHappening || 0,
                            aguardando: counters.supportPending || 0,
                            finalizados: counters.supportFinished || 0,
                            hora: moment(new Date()).format("HH:mm"),
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => moment(date).format("DD/MM HH:mm")}
                          stroke="#666"
                        />
                        <YAxis stroke="#666" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                            padding: "12px",
                          }}
                          formatter={(value, name) => {
                            if (name === "atendimento") {
                              return [`${value}`, "Em Atendimento"];
                            } else if (name === "aguardando") {
                              return [`${value}`, "Aguardando"];
                            } else if (name === "finalizados") {
                              return [`${value}`, "Finalizados"];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(date) => moment(date).format("DD/MM/YYYY HH:mm")}
                        />
                        <Legend 
                          iconType="circle"
                          formatter={(value) => {
                            if (value === "atendimento") return "Em Atendimento";
                            if (value === "aguardando") return "Aguardando";
                            if (value === "finalizados") return "Finalizados";
                            return value;
                          }}
                        />
                        <Bar
                          dataKey="atendimento"
                          name="atendimento"
                          fill="#2196F3"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="aguardando"
                          name="aguardando"
                          fill="#FF9800"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="finalizados"
                          name="finalizados"
                          fill="#4CAF50"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                    mt: { xs: 2, lg: 0 }
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Distribuição por Canais
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart width={400} height={400}>
                        <Pie
                          data={channelData}
                          cx={200}
                          cy={180}
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {channelData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              strokeWidth={0}
                            />
                          ))}
                        </Pie>
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            paddingTop: 20,
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value} tickets`, name]}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            padding: "8px 12px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Tabela de Atendentes */}
            <Card
              sx={{
                mt: 4,
                borderRadius: "16px",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Atendentes
                  </Typography>
                  <ButtonGroup variant="text" size="small">
                    <Button startIcon={<PrintIcon />}>Imprimir</Button>
                    <Button startIcon={<PictureAsPdfIcon />}>PDF</Button>
                    <Button startIcon={<InsertDriveFileIcon />}>Excel</Button>
                  </ButtonGroup>
                </Stack>
                <Box
                  id="grid-attendants"
                  sx={{
                    "& .MuiTableRow-root": {
                      transition: "background-color 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    },
                  }}
                >
                  <TableAttendantsStatus
                    attendants={attendants}
                    loading={loading}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Seção de Integração com Outros Módulos */}
            <Grid2 container spacing={3} sx={{ mt: 3 }}>
              {/* Card de Campanhas */}
              <Grid2 xs={12} sm={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px 0 rgba(31,38,135,0.25)",
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Campanhas Ativas
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: "#9c27b0" }}>
                          {campaignStats.active || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {campaignStats.deliveryRate || 0}% de taxa de entrega
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: "#9c27b015",
                          height: 56,
                          width: 56,
                          "& .MuiSvgIcon-root": {
                            color: "#9c27b0",
                            fontSize: 28,
                          },
                        }}
                      >
                        <CampaignIcon />
                      </Avatar>
                    </Stack>
                    <Box sx={{ mt: 3, height: 60 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(campaignStats.active || 0, 0.1)}>
                          <defs>
                            <linearGradient
                              id="gradient-campaigns"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#9c27b0" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#9c27b0" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#9c27b0"
                            fill="url(#gradient-campaigns)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>

              {/* Card de Agendamentos */}
              <Grid2 xs={12} sm={6} lg={8}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.15)",
                  }}
                >
                  <CardHeader 
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Próximos Agendamentos
                      </Typography>
                    } 
                    action={
                      <IconButton 
                        onClick={() => history.push('/schedules')}
                        sx={{
                          backgroundColor: `${theme.palette.primary.main}15`,
                          "&:hover": {
                            backgroundColor: `${theme.palette.primary.main}25`,
                          },
                        }}
                      >
                        <CalendarTodayIcon style={{ color: theme.palette.primary.main }} />
                      </IconButton>
                    } 
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {nextSchedules && nextSchedules.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {nextSchedules.map(schedule => (
                          <ListItem 
                            key={schedule.id} 
                            divider 
                            sx={{ 
                              px: 1,
                              py: 1,
                              borderRadius: '8px',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                          >
                            <ListItemText 
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {schedule.contact?.name || "Contato não especificado"}
                                </Typography>
                              } 
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {schedule.sendAt ? format(parseISO(schedule.sendAt), "dd/MM/yyyy HH:mm") : "Data não definida"}
                                </Typography>
                              } 
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Não há agendamentos próximos.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Distribuição do funil */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Funil de Vendas</Typography>
                <Grid2 container spacing={2}>
                  <Grid2 xs={12} md={8}>
                    <ResponsiveContainer width="100%" height={350}>
                      <FunnelChart>
                        <Tooltip
                          formatter={(value, name, props) => [
                            <>
                              <div>Quantidade: {value} tickets</div>
                              <div>Valor Total: {props.payload.totalValue.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              })}</div>
                            </>,
                            props.payload.name
                          ]}
                        />
                        <Funnel
                          dataKey="value"
                          data={funnelData}
                          labelLine={false}
                        >
                          {funnelData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || colors[index % colors.length]}
                            />
                          ))}
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </Grid2>
                  
                  {/* Legendas ao lado do funil */}
                  <Grid2 xs={12} md={4}>
                    <Stack spacing={2}>
                      {funnelData.map((entry, index) => (
                        <Card
                          key={index}
                          sx={{
                            p: 2,
                            backgroundColor: `${entry.color || colors[index % colors.length]}15`,
                            border: `1px solid ${entry.color || colors[index % colors.length]}30`,
                            borderRadius: 2
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: entry.color || colors[index % colors.length]
                              }}
                            />
                            <Stack sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {entry.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.value} tickets
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {entry.totalValue?.toLocaleString('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                })}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>

          </Container>
        </Box>
      )}
    </>
  );
};

export default Dashboard;
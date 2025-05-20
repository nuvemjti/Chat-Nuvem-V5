import React, { useState, useEffect } from 'react';
import { Box, Paper, Tooltip, Typography, Divider, Fab } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { SiOpenai } from 'react-icons/si';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

// Material-UI icons
import {
  AccessTime,
  CallSplit,
  ConfirmationNumber,
  DynamicFeed,
  HeadsetMic,
  Language,
  LibraryBooks,
  SwapHorizontalCircle,
} from '@material-ui/icons';

// MUI v5 icons que são usados no aplicativo
import BallotIcon from '@mui/icons-material/Ballot';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import RocketLaunch from '@mui/icons-material/RocketLaunch';

// Importação corrigida para Tag (usando o nome correto do componente no Material-UI)
import LocalOfferIcon from '@material-ui/icons/LocalOffer';

// Importe outros ícones que precisamos
import PlayArrow from '@material-ui/icons/PlayArrow';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import Image from '@material-ui/icons/Image';
import Videocam from '@material-ui/icons/Videocam';
import MicNone from '@material-ui/icons/MicNone';
import CategoryIcon from '@material-ui/icons/Category';
import CloseRounded from '@material-ui/icons/CloseRounded';

// Importe a imagem do Typebot
import typebotIcon from '../../assets/typebot-ico.png';
import { colorPrimary } from '../../styles/styles';

const useStyles = makeStyles((theme) => ({
  sidebarContainer: {
    position: 'absolute',
    left: 0, 
    top: 0,
    bottom: 0,
    width: 85,
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e0e0e0',
    zIndex: 1000,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: theme.spacing(0.3),
    paddingBottom: theme.spacing(5),
    transition: 'width 0.3s ease',
    height: '100%',
    scrollBehavior: 'smooth',
    '&:hover': {
      width: 100,
      '& $nodeLabel': {
        fontSize: 9,
        fontWeight: 600
      }
    },
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#bdbdbd',
      borderRadius: '3px',
      '&:hover': {
        background: '#9e9e9e',
      },
    },
    [theme.breakpoints.down('sm')]: {
      width: 70,
    },
  },
  compactLayout: {
    '& $categoryHeader': {
      marginTop: theme.spacing(0.2),
      marginBottom: theme.spacing(0.2),
      fontSize: 9,
    },
    '& $menuItem': {
      margin: theme.spacing(0.2, 0),
      width: 44,
      height: 58,
    },
    '& $divider': {
      margin: theme.spacing(0.2, 0),
    },
    '& $title': {
      fontSize: 12,
      marginBottom: theme.spacing(0.3),
      padding: theme.spacing(0.3),
    },
    '& $nodeLabel': {
      fontSize: 7,
    }
  },
  categoryHeader: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    width: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    transition: 'color 0.2s ease',
    cursor: 'default',
    padding: theme.spacing(0.5, 0),
    position: 'sticky',
    top: theme.spacing(5),
    backgroundColor: '#f8f9fa',
    zIndex: 1,
    borderTop: '1px solid rgba(0,0,0,0.05)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  activeCategory: {
    color: colorPrimary(),
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
  },
  menuItem: {
    width: 48,
    height: 58,
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: theme.spacing(0.5, 0),
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    padding: theme.spacing(0.5, 0.5, 0),
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      backgroundColor: '#e6f2ff',
    },
    [theme.breakpoints.down('sm')]: {
      width: 40,
      height: 50,
    },
  },
  nodeLabel: {
    fontSize: 7,
    marginTop: theme.spacing(0.2),
    color: '#555',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    lineHeight: 1.1,
    paddingBottom: theme.spacing(0.3)
  },
  icon: {
    fontSize: 24,
  },
  tooltip: {
    fontSize: 13,
    padding: theme.spacing(1),
    backgroundColor: '#333',
    maxWidth: 220,
  },
  imgIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    textAlign: 'center',
    width: '100%',
    borderBottom: '1px solid #ddd',
    position: 'sticky',
    top: 0,
    backgroundColor: '#f8f9fa',
    zIndex: 2,
  },
  selected: {
    border: `2px solid ${colorPrimary()}`,
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    backgroundColor: '#e6f7ff',
    '& $nodeLabel': {
      color: colorPrimary(),
      fontWeight: 600
    }
  },
  divider: {
    width: '70%',
    margin: theme.spacing(0.5, 0),
    opacity: 0.7,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: theme.spacing(0.5),
    opacity: 0.7,
  },
  categorySpacer: {
    height: theme.spacing(2),
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    width: 30,
    height: 30,
    minHeight: 30,
    opacity: 0.8,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    '&:hover': {
      opacity: 1,
      backgroundColor: colorPrimary(),
    },
  },
  scrollTopIcon: {
    fontSize: 18,
  }
}));

// Descrições detalhadas para tooltips
const getTooltipContent = (type) => {
  const descriptions = {
    start: 'Ponto inicial para começar a construir seu fluxo de conversa.',
    content: 'Adicione textos e mensagens formatadas ao seu fluxo.',
    menu: 'Crie opções interativas para o usuário escolher.',
    random: 'Distribui o fluxo aleatoriamente entre diferentes caminhos.',
    interval: 'Adicione uma pausa programada no fluxo de conversa.',
    ticket: 'Gera um ticket de atendimento no sistema.',
    typebot: 'Integre com fluxos do TypeBot para expandir funcionalidades.',
    openai: 'Utilize inteligência artificial para gerar respostas dinâmicas.',
    question: 'Adicione um ponto para coleta de informações do usuário.',
    switchFlow: 'Direcione a conversa para outro fluxo do sistema.',
    attendant: 'Transfira o atendimento para um operador humano.',
    tag: 'Adicione marcações para segmentação de usuários.',
    tagKanban: 'Adicione marcações para o quadro Kanban de atendimento.',
    condition: 'Crie regras lógicas baseadas em variáveis do sistema.',
    img: 'Adicione imagens ao seu fluxo de conversa.',
    audio: 'Insira arquivos de áudio ou gravações no fluxo.',
    video: 'Inclua vídeos no fluxo de conversa.',
    closeTicket: 'Fecha um ticket de atendimento no sistema.',
  };
  return descriptions[type] || type;
};

const FlowBuilderSidebar = ({ onNodeSelect }) => {
  const classes = useStyles();
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sidebarRef = React.useRef(null);

  const handleSelect = (id) => {
    setSelected(id);
    onNodeSelect(id);
  };

  // Encontrar a categoria ativa quando um item é selecionado
  useEffect(() => {
    if (selected) {
      const category = menuCategories.findIndex(category => 
        category.items.some(item => item.id === selected)
      );
      setActiveCategory(category);
    }
  }, [selected]);

  // Função para rolar até a categoria quando ela for ativada
  useEffect(() => {
    if (activeCategory !== null && sidebarRef.current) {
      const categoryElements = sidebarRef.current.querySelectorAll(`.${classes.categoryHeader}`);
      if (categoryElements[activeCategory]) {
        const offset = categoryElements[activeCategory].offsetTop - 50;
        sidebarRef.current.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      }
    }
  }, [activeCategory, classes.categoryHeader]);

  // Controlar a visibilidade do botão de voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        setShowScrollTop(sidebarRef.current.scrollTop > 100);
      }
    };

    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('scroll', handleScroll);
      return () => {
        sidebarElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const scrollToTop = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Agrupando os itens por categoria de forma mais compacta
  const menuCategories = [
    {
      title: "Básicos",
      icon: <RocketLaunch style={{fontSize: '14px'}} />,
      items: [
        { id: 'start', label: 'Início', icon: <RocketLaunch style={{ color: '#3ABA38', fontSize: '20px' }} /> },
        { id: 'content', label: 'Conteúdo', icon: <LibraryBooks style={{ color: '#EC5858', fontSize: '20px' }} /> },
        { id: 'menu', label: 'Menu', icon: <DynamicFeed style={{ color: '#683AC8', fontSize: '20px' }} /> },
      ]
    },
    {
      title: "Mídia",
      icon: <Image style={{fontSize: '14px'}} />,
      items: [
        { id: 'img', label: 'Imagem', icon: <Image style={{ color: '#6865A5', fontSize: '20px' }} /> },
        { id: 'audio', label: 'Áudio', icon: <MicNone style={{ color: '#6865A5', fontSize: '20px' }} /> },
        { id: 'video', label: 'Vídeo', icon: <Videocam style={{ color: '#6865A5', fontSize: '20px' }} /> },
      ]
    },
    {
      title: "Fluxo",
      icon: <SwapHoriz style={{fontSize: '14px'}} />,
      items: [
        { id: 'interval', label: 'Intervalo', icon: <AccessTime style={{ color: '#F7953B', fontSize: '20px' }} /> },
        { id: 'random', label: 'Randomizador', icon: <CallSplit style={{ color: '#1FBADC', fontSize: '20px' }} /> },
        { id: 'condition', label: 'Condição', icon: <SwapHorizontalCircle style={{ color: '#3ABA38', fontSize: '20px' }} /> },
        { id: 'switchFlow', label: 'TrocarFlow', icon: <MultipleStopIcon style={{ color: '#EC5858', fontSize: '20px' }} /> },
        { id: 'request', label: 'Requisição', icon: <Language style={{ color: '#F7953B', fontSize: '20px' }} /> },
      ]
    },
    
    {
      title: "Integr.",
      icon: <CategoryIcon style={{fontSize: '14px'}} />,
      items: [
        { 
          id: 'typebot', 
          label: 'TypeBot', 
          icon: (
            <img 
              className={classes.imgIcon}
              src={typebotIcon}
              alt="Typebot"
              style={{ width: '20px', height: '20px' }}
            />
          ) 
        },
        { id: 'openai', label: 'OpenAI', icon: <SiOpenai style={{ color: '#3ABA38', fontSize: '20px' }} /> },
      ]
    },
    {
      title: "Atend.",
      icon: <HeadsetMic style={{fontSize: '14px'}} />,
      items: [
        { id: 'ticket', label: 'Setor', icon: <ConfirmationNumber style={{ color: '#3ABA38', fontSize: '20px' }} /> },
        { id: 'attendant', label: 'Attend.', icon: <HeadsetMic style={{ color: '#3ABA38', fontSize: '20px' }} /> },
        { id: 'question', label: 'Pergunta', icon: <BallotIcon style={{ color: '#EC5858', fontSize: '20px' }} /> },
      ]
    },
    {
      title: "Tags",
      icon: <LocalOfferIcon style={{fontSize: '14px'}} />,
      items: [
        { id: 'tag', label: 'Tag', icon: <LocalOfferIcon style={{ color: '#3ABA38', fontSize: '20px' }} /> },
        { id: 'tagKanban', label: 'TagKanban', icon: <LocalOfferIcon style={{ color: '#F7953B', fontSize: '20px' }} /> },
      ]
    },
    {
      title: "Ações",
      icon: <CloseRounded style={{fontSize: '14px'}} />,
      items: [
        { id: 'closeTicket', label: 'Fechar Ticket', icon: <CloseRounded style={{ color: '#F44336', fontSize: '20px' }} /> },
      ]
    },
  ];

  return (
    <Paper 
      ref={sidebarRef}
      className={`${classes.sidebarContainer} ${classes.compactLayout}`} 
      elevation={3}
    >
      <Typography className={classes.title}>
        Adicionar Nós
      </Typography>
      
      {menuCategories.map((category, index) => (
        <React.Fragment key={`category-${index}`}>
          <Typography 
            className={`${classes.categoryHeader} ${activeCategory === index ? classes.activeCategory : ''}`}
          >
            {category.icon && <span className={classes.categoryIcon}>{category.icon}</span>}
            {category.title}
          </Typography>
          
          {category.items.map((item) => (
            <Tooltip
              key={item.id}
              title={
                <React.Fragment>
                  <Typography variant="subtitle2">{item.label}</Typography>
                  <Typography variant="body2">{getTooltipContent(item.id)}</Typography>
                </React.Fragment>
              }
              placement="right"
              arrow
              classes={{ tooltip: classes.tooltip }}
            >
              <Box
                className={`${classes.menuItem} ${selected === item.id ? classes.selected : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <div style={{ marginTop: '4px', height: '24px', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </div>
                <Typography className={classes.nodeLabel}>
                  {item.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
          
          {index < menuCategories.length - 1 && (
            <Divider className={classes.divider} />
          )}
        </React.Fragment>
      ))}
      <div className={classes.categorySpacer} />
      
      {showScrollTop && (
        <Fab 
          size="small" 
          color="primary" 
          aria-label="voltar ao topo" 
          className={classes.scrollTopButton}
          onClick={scrollToTop}
        >
          <KeyboardArrowUpIcon className={classes.scrollTopIcon} />
        </Fab>
      )}
    </Paper>
  );
};

export default FlowBuilderSidebar;
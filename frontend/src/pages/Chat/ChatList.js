import React, { useContext, useState } from "react";
import {
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
} from "@material-ui/core";

import { useHistory, useParams } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import { useRef, useEffect } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import { useTheme } from "@mui/material";

import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "calc(100% - 60px)",
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: theme.mode === 'light' ? "#f2f2f2" : "#7f7f7f",
    
  },
  chatList: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflowX: "hidden", // Garante que a rolagem horizontal nunca apareça
    overflowY: "auto",   // Permite a rolagem vertical quando necessário
    maxHeight: "98%",
    ...theme.scrollbarStyles,
    //border: "3px solid rgba(0, 0, 0, 0.12)",
  },
  listItemActive: {
    //extend: "listItem",
    cursor: "pointer",
    backgroundColor: "#d6d6d6",
    borderLeft: `6px solid ${theme.palette.primary.main}`,
    borderRadius: "12px", // Bordas arredondadas
    padding: "10px", // Mais espaço interno para um visual mais agradável
    margin: "1px", // Espaçamento entre os itens
    transition: "background 0.3s ease",
    "&:hover": {
      backgroundColor: theme.palette.grey[400], // Um leve destaque ao passar o mouse
    },    
},
  listItem: {
    position: "relative", // Para permitir posicionamento absoluto dos ícones
    display: "flex",
    alignItems: "flex-start", // Alinha o conteúdo no topo
    cursor: "pointer",
    backgroundColor: theme.palette.background.default,
    border: "2px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "12px", // Bordas arredondadas
    padding: "10px",
    margin: "1px",
    minHeight: "60px",
    overflow: "hidden", // Evita que os ícones forcem scroll
    transition: "background 0.3s ease",
    
    
  },
  listItemText: {
    flex: 1, 
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listItemSecondaryAction: {
    position: "absolute", // Permite posicionamento manual
    top: "5px", // Posiciona no topo
    right: "5px", // Mantém no canto direito
    display: "flex",
    gap: "5px", // Espaço entre os ícones
  },
  iconButton: {
    backgroundColor: `${theme.palette.primary.main}15`,  // Cor de fundo com transparência
    borderRadius: "50%",                                  // Deixa o ícone com borda arredondada
    padding: "4px",                                       // Tamanho do fundo
    marginRight: "4px",                                    // Separação entre os ícones (ajuste conforme necessário)
    "&:hover": {
      backgroundColor: `${theme.palette.primary.main}25`, // Escurece o fundo ao passar o mouse
      boxShadow: `0 4px 6px rgba(${parseInt(theme.palette.primary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.primary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.2)`, // Sombra com a cor primária
    },
  },
  
  iconButtonDelete: {
    backgroundColor: `${theme.palette.primary.main}15`,  // Cor de fundo com transparência
    borderRadius: "50%",                                  // Deixa o ícone com borda arredondada
    padding: "4px",                                       // Tamanho do fundo
    marginLeft: "4px",                                     // Separação entre os ícones (ajuste conforme necessário)
    "&:hover": {
      backgroundColor: `${theme.palette.primary.main}25`, // Escurece o fundo ao passar o mouse
      boxShadow: `0 4px 6px rgba(${parseInt(theme.palette.primary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.primary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.2)`, // Sombra com a cor primária
    },
  },
  scrollIndicator: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "50%",
    padding: "5px",
    cursor: "pointer",
    zIndex: 10,
    transition: "top 0.1s ease-in-out, background 0.2s", // Suaviza o movimento
    animation: "bounce 1.5s infinite",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.4)", // Escurece ao passar o mouse
    },
    "&:active": {
      transform: "translateX(-50%) scale(0.9)", // Dá um efeito de clique
    },
  },
  
}));

export default function ChatList({
  chats,
  handleSelectChat,
  handleDeleteChat,
  handleEditChat,
  pageInfo,
  loading,
}) {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const theme = useTheme();

  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const chatListRef = useRef(null);

  const [confirmationModal, setConfirmModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState({});

  const { id } = useParams();

  const goToMessages = async (chat) => {
    if (unreadMessages(chat) > 0) {
      try {
        await api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }

    if (id !== chat.uuid) {
      history.push(`/chats/${chat.uuid}`);
      handleSelectChat(chat);
    }
  };

  const handleDelete = () => {
    handleDeleteChat(selectedChat);
  };

  const unreadMessages = (chat) => {
    const currentUser = chat.users.find((u) => u.userId === user.id);
    return currentUser.unreads;
  };

  const getPrimaryText = (chat) => {
    const mainText = chat.title;
    const unreads = unreadMessages(chat);
    return (
      <>
        {mainText}
        {unreads > 0 && (
          <Chip
            size="small"
            style={{ marginLeft: 5 }}
            label={unreads}
            color="secondary"
          />
        )}
      </>
    );
  };

  const getSecondaryText = (chat) => {
    return chat.lastMessage !== ""
      ? `${datetimeToClient(chat.updatedAt)}: ${chat.lastMessage}`
      : "";
  };

  const scrollToBottom = () => {
    if (chatListRef.current) {
      chatListRef.current.scrollTo({
        top: chatListRef.current.scrollHeight,
        behavior: "smooth", // Faz a rolagem suave
      });
    }
  };

  useEffect(() => {
    const checkScroll = () => {
      if (chatListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
        
        setHasMoreChats(scrollHeight > clientHeight); // Verifica se há mais itens ocultos
        
        // Atualiza a posição do ícone conforme o usuário rola
        setScrollPosition(scrollTop + clientHeight - 50);
  
        // Oculta o ícone quando chega ao final
        setIsNearBottom(scrollTop + clientHeight >= scrollHeight - 10);
      }
    };
  
    if (chatListRef.current) {
      chatListRef.current.addEventListener("scroll", checkScroll);
    }
  
    checkScroll(); // Verifica inicialmente
  
    return () => {
      if (chatListRef.current) {
        chatListRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, [chats]);

  return (
    <>
      <ConfirmationModal
        title={"Excluir Conversa"}
        open={confirmationModal}
        onClose={setConfirmModalOpen}
        onConfirm={handleDelete}
      >
        Esta ação não pode ser revertida, confirmar?
      </ConfirmationModal>
      <div className={classes.mainContainer}>        
      <div className={classes.chatList} ref={chatListRef}>       
          <List>
            {Array.isArray(chats) && 
              chats.length > 0 &&
              chats.map((chat, key) => (                
                <ListItem
                  onClick={() => goToMessages(chat)}
                  key={key}
                  className={chat.uuid === id ? classes.listItemActive : classes.listItem}
                  // style={getItemStyle(chat)}
                  button
                >
                  <ListItemText
                    primary={getPrimaryText(chat)}
                    secondary={getSecondaryText(chat)}
                    className={classes.listItemText} //aplica nova classe
                  />
                  {chat.ownerId === user.id && (
                    <div className={classes.listItemSecondaryAction}> {/*ATT*/}
                      <IconButton                        
                        onClick={() => {
                          goToMessages(chat).then(() => {
                            handleEditChat(chat);
                          });
                        }}
                        className={classes.iconButton}  // Aplica a classe
                        aria-label="edit" //ATT
                        size="small"                        
                      >
                        <EditIcon style={{ color: theme.palette.primary.main }} />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setSelectedChat(chat);
                          setConfirmModalOpen(true);
                        }}
                        className={classes.iconButtonDelete}  // Aplica a classe                        
                        aria-label="delete"
                        size="small"
                      >
                        <DeleteIcon style={{ color: theme.palette.error.main }} />
                      </IconButton>
                      </div>                    
                  )}
                </ListItem>
              ))}
          </List>
          {/* Exibir o indicador se houver mais chats e o usuário não estiver no final */}
          {hasMoreChats && !isNearBottom && (
            <div
              className={classes.scrollIndicator}
              style={{ top: `${scrollPosition}px` }} // Ajusta a posição dinamicamente
              onClick={scrollToBottom} // ⬅️ Adiciona o evento de clique
            >
              <ExpandMoreIcon style={{ color: theme.palette.primary.main }} />
            </div>
          )}


        </div>
      </div>
    </>
  );
}
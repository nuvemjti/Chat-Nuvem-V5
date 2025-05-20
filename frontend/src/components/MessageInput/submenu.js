import React, { useContext, useEffect, useState } from 'react';
import { Menu, MenuItem, MenuButton, SubMenu } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import './styles.css';
import QuickreplyIcon from '@mui/icons-material/Quickreply';
import { AuthContext } from '../../context/Auth/AuthContext';
import useQuickMessages from '../../hooks/useQuickMessages';
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { Tooltip } from '@material-ui/core';

export const Submenus = (props) => {
  const { setInputMessage, setMediaUrl, setMediaName, handleQuickAnswersClick } = props;

  const { user } = useContext(AuthContext);
  const { list2: listQuickMessages } = useQuickMessages();
  const [listCategories, setListCategories] = useState([]);

  useEffect(() => {
    getListMessages();
  }, []);

  const getListMessages = async () => {
    try {
      const companyId = localStorage.getItem("companyId");
      const messages = await listQuickMessages({ companyId, userId: user.id });
      setListCategories(messages);
    } catch (e) {
      console.error(e);
    }
  };

  const limitCaracteres = (message) => {
    if (message.length > 30) {
      return message.substring(0, 30) + '...';
    } else {
      return message;
    }
  };

  return (
    <Menu 
      menuStyle={{ fontSize: 12 }} 
      menuButton={
        <MenuButton 
          style={{
            border: 'none', 
            background: 'none', 
            width: '25px',   // Defina a largura para manter o círculo
			height: '25px',  // Defina a altura igual à largura para um círculo perfeito  // Mantivemos a altura reduzida
            display: 'flex', 
            alignItems: 'center',
			justifyContent: 'center', // Alinha o ícone no centro, 
            fontSize: 18,  // Mantivemos o tamanho reduzido da fonte
            borderRadius: '50%',  // Borda redonda
            padding: '0',       // Ajuste o padding para controlar o tamanho do círculo do hover
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#f0f0f0',  // Cor de fundo ao passar o mouse
              border: '2px solid #757575', // Borda cinza mais forte (ajustável)             
              // Reduza o padding para diminuir o tamanho do círculo de hover
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',  // Adiciona uma sombra suave ao redor para um efeito mais sutil
            }
          }}
        >
          <QuickreplyIcon style={{ fontSize: 22, color: '#808080' }} />  {/* Cor cinza mais escura e ícone menor */}
        </MenuButton>
      }
    >
      {listCategories.map((category) => (
        <SubMenu menuStyle={{ maxHeight: 180, overflowY: "scroll" }} label={category.shortcode}>
          {category.messages.map((message) => (
            <Tooltip title={message.message} placement="top" arrow key={message.id}>
              <MenuItem
                onClick={() => handleQuickAnswersClick({
                  value: message.message,
                  mediaPath: message.mediaPath,
                  mediaName: message.mediaName,
                })}
              >
                {message.mediaPath ? <AttachFileIcon style={{ fontSize: 15 }} /> : ''}
                {limitCaracteres(message.message)}
              </MenuItem>
            </Tooltip>
          ))}
        </SubMenu>
      ))}
    </Menu>
  );
};

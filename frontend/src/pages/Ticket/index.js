import React, { useEffect, useState } from 'react';

const handleTicketUpdate = () => {
  setTicket(prevTicket => ({
    ...prevTicket,
    status: "open"
  }));
  fetchTicket();
};

const [ticket, setTicket] = useState(null);
const [canInputMessage, setCanInputMessage] = useState(false);

useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    if (isMounted) {
      if (ticket?.status === "open") {
        // Habilitar input de mensagem
        setCanInputMessage(true);
      }
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, [ticket?.status]);

return (
  <TicketActionButtonsCustom 
    onUpdate={handleTicketUpdate}
  />
); 
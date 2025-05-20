import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core';

const TicketEditModal = ({ open, handleClose, ticketId, onTicketEdit }) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Ticket #{ticketId}</DialogTitle>
      <DialogContent>
        {/* Conteúdo do modal de edição */}
        <p>Carregando informações do ticket...</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onTicketEdit} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketEditModal; 
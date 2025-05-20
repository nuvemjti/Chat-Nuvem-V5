// frontend/src/components/TicketEditModal/index.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  makeStyles
} from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    minWidth: 400
  },
  field: {
    marginBottom: theme.spacing(2)
  }
}));

const TicketEditModal = ({ open, onClose, ticket, onUpdate }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState({
    value: "",
    productSku: ""
  });

  useEffect(() => {
    if (ticket) {
      setTicketData({
        value: ticket.value || "",
        productSku: ticket.productSku || ""
      });
    }
  }, [ticket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        value: ticketData.value ? parseFloat(ticketData.value) : null,
        productSku: ticketData.productSku
      });
      
      toast.success(i18n.t("ticketModal.success"));
      onUpdate();
      onClose();
    } catch (err) {
      console.log(err);
      toast.error(i18n.t("ticketModal.error"));
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("ticketModal.title")}</DialogTitle>
      <DialogContent className={classes.content}>
        <TextField
          label={i18n.t("ticketModal.value")}
          name="value"
          type="number"
          value={ticketData.value}
          onChange={handleChange}
          className={classes.field}
          fullWidth
          variant="outlined"
          InputProps={{
            startAdornment: "R$"
          }}
        />
        <TextField
          label={i18n.t("ticketModal.sku")}
          name="productSku"
          value={ticketData.productSku}
          onChange={handleChange}
          className={classes.field}
          fullWidth
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="secondary"
          disabled={loading}
        >
          {i18n.t("ticketModal.buttons.cancel")}
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          {loading ? i18n.t("ticketModal.buttons.loading") : i18n.t("ticketModal.buttons.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketEditModal;
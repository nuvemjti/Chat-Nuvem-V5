import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";

const BoardSettingsModal = ({ open, onClose, setMakeRequest }) => {
  const handleSave = () => {
    setMakeRequest(new Date().getTime());
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Configurações do Kanban</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Mostrar valores e SKUs"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardSettingsModal; 
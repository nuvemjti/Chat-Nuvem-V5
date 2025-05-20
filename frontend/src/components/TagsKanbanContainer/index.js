import {
  Chip,
  Paper,
  Select,
  MenuItem,
  Grid,
  InputLabel,
  FormControl,
} from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import { isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import { Field, Form } from "formik";
import { TagService } from "../../services/tagService";

const useStyles = makeStyles((theme) => ({
  menuListItem: {
    paddingTop: 0,
    paddingBottom: 0,
    border: "none",
  },
  menuItem: {
    maxHeight: 30,
  },

  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
  },
}));

export function TagsKanbanContainer({ ticket }) {
  const classes = useStyles();
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    loadTags();
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (ticket?.tags && Array.isArray(ticket.tags) && ticket.tags.length > 0) {
      setSelected(ticket.tags[0].id);
    } else {
      setSelected("");
    }
  }, [ticket]);

  const loadTags = async () => {
    if (!mounted.current) return;

    try {
      setLoading(true);
      const data = await TagService.listKanbanTags();
      if (mounted.current) {
        if (data && Array.isArray(data.lista)) {
          setTags(data.lista);
        } else {
          console.error("Formato de dados inválido:", data);
          toast.error("Erro no formato dos dados das tags");
        }
      }
    } catch (err) {
      console.error("Erro ao carregar tags:", err);
      if (mounted.current) {
        toast.error("Erro ao carregar tags do Kanban");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const handleChange = async (e) => {
    if (!mounted.current) return;

    const newTagId = e.target.value;
    console.log("Novo ID da tag:", newTagId);
    setLoading(true);

    try {
      if (
        ticket?.tags &&
        Array.isArray(ticket.tags) &&
        ticket.tags.length > 0
      ) {
        await api.put(`/ticket-tags/${ticket.id}/${newTagId}`);
      } else if (newTagId) {
        if (newTagId === "empty") {
          await api.delete(`/ticket-tags/${ticket.id}`);
          await api.put(`/ticket-tags/${ticket.id}/empty`);
        } else {
          await api.delete(`/ticket-tags/${newTagId}`);
          await api.put(`/ticket-tags/${ticket.id}/${newTagId}`);
        }
      }

      if (mounted.current) {
        setSelected(newTagId);
        toast.success("Tag atualizada com sucesso!");

        setTimeout(() => {
          window.location.reload(); // Recarrega a página
          }, 1000); // 1000ms = 1 segundo
      }
    } catch (err) {
      console.error("Erro ao atualizar tag:", err);
      if (mounted.current) {
        toast.error("Erro ao atualizar tag. Tente novamente.");
        await loadTags();
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const renderSelectedValue = () => {
    const selectedTag = tags.find((tag) => tag.id === selected);
    if (!selectedTag) return null;

    return (
      <Chip
        style={{
          backgroundColor: selectedTag.color,
          color: "#FFF",
          marginRight: 1,
          padding: 1,
          fontWeight: "bold",
          paddingLeft: 5,
          paddingRight: 5,
          borderRadius: 3,
          fontSize: "0.8em",
          whiteSpace: "nowrap",
        }}
        label={selectedTag.name}
        size="small"
      />
    );
  };

  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel>{i18n.t("Etapa Kanban")}</InputLabel>
      <Select
        value={selected}
        onChange={handleChange}
        label={i18n.t("Etapa Kanban")}
        disabled={loading}
      >
        <MenuItem value="empty">
          <em>Nenhuma</em>
        </MenuItem>
        {tags.map((tag) => (
          <MenuItem key={tag.id} value={tag.id}>
            {tag.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

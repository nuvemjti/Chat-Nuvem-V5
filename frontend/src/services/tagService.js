import api from "./api";

export const TagService = {
    // Listar tags do Kanban
    async listKanbanTags() {
        try {
            const { data } = await api.get("/tag/kanban");
            return data;
        } catch (error) {
            console.error("Erro ao listar tags:", error);
            throw error;
        }
    },

    // Adicionar tag a um ticket
    async addTag(ticketId, tagId) {
        try {
            const { data } = await api.post("/ticket-tags", {
                ticketId: parseInt(ticketId),
                tagId: parseInt(tagId)
            });
            return data;
        } catch (error) {
            console.error("Erro ao adicionar tag:", error);
            throw error;
        }
    },

    // Remover tag de um ticket
    async removeTag(ticketId, tagId) {
        try {
            const { data } = await api.delete(`/ticket-tags/${ticketId}/${tagId}`);
            return data;
        } catch (error) {
            console.error("Erro ao remover tag:", error);
            throw error;
        }
    },

    // Atualizar tags de um ticket
    async updateTicketTags(ticketId, tagId) {
        try {
            const { data } = await api.put(`/ticket-tags/${parseInt(ticketId)}`, {
                tagId: parseInt(tagId)
            });
            return data;
        } catch (error) {
            console.error("Erro ao atualizar tags:", error);
            throw new Error("Erro ao atualizar tags");
        }
    }
};

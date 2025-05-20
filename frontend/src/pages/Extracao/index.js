import React, { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { makeStyles } from "@material-ui/core/styles";
import { io } from "socket.io-client";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
    Box,
    Button,
    TextField,
    Typography,
    Modal,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Grid,
} from "@mui/material";
import { CheckCircle, Error, HourglassEmpty } from "@mui/icons-material";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";


const LeadExtraction = () => {
    const classes = useStyles();
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("new"); // 'new' ou 'details'
    const [extractions, setExtractions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        state: "",
        city: "",
        segment: "",
        leadCount: "",
    });
    const [modalData, setModalData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleOpenModal = (type, data = {}) => {
        setModalType(type);
        setModalData(data);
        setShowModal(true);
    };

    const handleCreateContactList = async (idList) => {
        try {
            const captacaoId = idList 
            const response = await api.post("/createContactList", { captacaoId });
            if (response.status === 200) {
                toast.success("Lista criada com sucesso");
                handleCloseModal()
            } else {
                toastError("Erro ao criar a lista de contatos");
            }
        } catch (error) {
            toastError(error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        if (modalType === "new") {
            setFormData({ state: "", city: "", segment: "", leadCount: "" });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSaveExtraction = async () => {
        if (formData.state && formData.city && formData.segment && formData.leadCount) {
            setLoading(true);
            try {
                const response = await api.post("/newextractions", formData);
                if (response.status !== 200) {
                    throw new Error("Erro ao salvar extração");
                }
                fetchExtractions(); // Atualiza a lista após salvar
                handleCloseModal();
            } catch (error) {
                console.error("Erro ao salvar extração:", error);
            } finally {
                setLoading(false);
            }
        } else {
            console.error("Todos os campos são obrigatórios!");
        }
    };

    const fetchExtractions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/extractions");
            setExtractions(data.data);
        } catch (error) {
            console.error("Erro ao buscar extrações:", error);
        } finally {
            setLoading(false);
        }
    };

    const { user, socket } = useContext(AuthContext);

    useEffect(() => {
        fetchExtractions();
    }, []); // Adicionando dependência do companyId

    const handleDeleteExtraction = async (id) => {
        try {
            await api.delete(`/extractions/${id}`);
            toast.success("Lista excluída com sucesso");
            fetchExtractions(); // Atualiza a lista
            handleCloseModal();
        } catch (error) {
            toastError("Erro ao excluir a lista");
        }
    };

    const renderStatusBadge = (status) => {
        const styles = {
            badge: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500,
            },
            generating: {
                backgroundColor: '#ffeb3b',
                color: '#000',
            },
            completed: {
                backgroundColor: '#4caf50',
                color: '#fff',
            },
            error: {
                backgroundColor: '#f44336',
                color: '#fff',
            },
            unknown: {
                backgroundColor: '#9e9e9e',
                color: '#fff',
            },
        };

        switch (status) {
            case 1:
                return (
                    <Box sx={{ ...styles.badge, ...styles.generating }}>
                        <HourglassEmpty fontSize="small" />
                        Gerando
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ ...styles.badge, ...styles.completed }}>
                        <CheckCircle fontSize="small" />
                        Concluído
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ ...styles.badge, ...styles.error }}>
                        <Error fontSize="small" />
                        Erro
                    </Box>
                );
            default:
                return (
                    <Box sx={{ ...styles.badge, ...styles.unknown }}>
                        Desconhecido
                    </Box>
                );
        }
    };


    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Captação de Leads
            </Typography>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenModal("new")}
                    sx={{
                        borderRadius: 25,
                        backgroundColor: '#6B21A8', // Cor roxa padrão
                        '&:hover': {
                            backgroundColor: '#581C87', // Cor roxa mais escura no hover
                        },
                        textTransform: 'none', // Mantém o texto sem uppercase
                        padding: '8px 20px',
                        fontSize: '0.9rem',
                        boxShadow: 'none'
                    }}
                >
                    Nova Extração
                </Button>
            </Box>

            <Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Cidade</strong></TableCell>
                                <TableCell><strong>Segmento</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {extractions.length > 0 ? (
                                extractions.map((extraction, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{extraction.state}</TableCell>
                                        <TableCell>{extraction.city}</TableCell>
                                        <TableCell>{extraction.segment}</TableCell>
                                        <TableCell>
                                            {renderStatusBadge(extraction.status)}
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleOpenModal("details", extraction)}
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        Nenhuma extração encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Modal open={showModal} onClose={handleCloseModal}>
                <Box
                    p={3}
                    sx={{
                        width: 700,  // Aumentando a largura para melhor aproveitamento de espaço
                        maxHeight: "90vh",
                        margin: "auto",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "#fff",
                        borderRadius: 3,
                        boxShadow: 3,
                        overflowY: "auto",
                        padding: 3,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {modalType === "new" ? (
                        <>
                            <Typography variant="h5" gutterBottom fontWeight={600}>
                                Nova Extração
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Estado"
                                        name="state"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.state}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Cidade"
                                        name="city"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.city}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Segmento"
                                        name="segment"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.segment}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Número de Leads"
                                        name="leadCount"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.leadCount}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                            </Grid>
                            <Box display="flex" justifyContent="space-between" mt={3}>
                                <Button variant="outlined" onClick={handleCloseModal} sx={{ width: "48%" }}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSaveExtraction}
                                    disabled={loading}
                                    sx={{ width: "48%" }}
                                >
                                    {loading ? <CircularProgress size={24} /> : "Salvar"}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" gutterBottom fontWeight={600}>
                                Detalhes da Extração
                            </Typography>
                            <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleCreateContactList(modalData.id)}
                                >
                                    Importar para Lista de contatos
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleDeleteExtraction(modalData.id)}
                                >
                                    Excluir Lista
                                </Button>
                            </Box>
                            <Grid container spacing={3} mb={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography><strong>ID:</strong> {modalData.id}</Typography>
                                    <Typography><strong>Estado:</strong> {modalData.state}</Typography>
                                    <Typography><strong>Cidade:</strong> {modalData.city}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography><strong>Segmento:</strong> {modalData.segment}</Typography>
                                    <Typography><strong>Status:</strong> {modalData.status}</Typography>
                                    <Typography><strong>Número de Leads:</strong> {modalData.leadCount}</Typography>
                                    <Typography><strong>Criado em:</strong> {new Date(modalData.createdAt).toLocaleString()}</Typography>
                                </Grid>
                            </Grid>

                            {/* Itens da Extração */}
                            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                                Itens da Extração:
                            </Typography>
                            <Box
                                sx={{
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    border: "1px solid #ddd",
                                    borderRadius: 2,
                                    padding: 2,
                                    backgroundColor: "#f9f9f9",
                                }}
                            >
                                {modalData.itens && modalData.itens.length > 0 ? (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Nome</strong></TableCell>
                                                    <TableCell><strong>Email</strong></TableCell>
                                                    <TableCell><strong>Telefone</strong></TableCell>
                                                    <TableCell><strong>Endereço</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {modalData.itens.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.Name || "Não informado"}</TableCell>
                                                        <TableCell>{item.Email || "Não informado"}</TableCell>
                                                        <TableCell>{item.Phone || "Não informado"}</TableCell>
                                                        <TableCell>{item.adress || "Não informado"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography>Nenhum item encontrado.</Typography>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

        </Box>
    );
};

export default LeadExtraction;

// CSS
const useStyles = makeStyles((theme) => ({
    badgeGenerating: {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#ffeb3b',
        color: '#000',
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '12px',
    },
    badgeCompleted: {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#4caf50',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '12px',
    },
    badgeError: {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#f44336',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '12px',
    },
}));

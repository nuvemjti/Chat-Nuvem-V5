import axios from "axios";
import { toast } from 'react-hot-toast';

const api = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL,
	withCredentials: true,
});

api.interceptors.response.use(
	response => response,
	error => {
		if (error.response?.status === 404) {
			toast.error('Recurso não encontrado. Verifique se o backend está configurado corretamente.');
		} else if (error.response?.status === 500) {
			toast.error('Erro interno do servidor. Por favor, tente novamente mais tarde.');
		}
		return Promise.reject(error);
	}
);

export const openApi = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL
	
});

export default api;

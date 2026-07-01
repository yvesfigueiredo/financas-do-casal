import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor de resposta - extrai o campo `data` da resposta padrão da API
api.interceptors.response.use(
  (response) => {
    // A API sempre retorna { success, data, message }
    // Retornamos direto o response para os services tratarem
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.error ??
      error.message ??
      "Erro de conexão com o servidor";
    return Promise.reject(new Error(message));
  }
);

export default api;

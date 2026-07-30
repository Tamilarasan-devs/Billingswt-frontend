import api from './api';

export const createInvoice = async (data) => {
  const response = await api.post('/billing', data);
  return response.data;
};

export const getInvoices = async (page = 1, limit = 10) => {
  const response = await api.get(`/billing?page=${page}&limit=${limit}`);
  return response.data;
};

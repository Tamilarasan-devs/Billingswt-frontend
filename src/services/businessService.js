import api from './api';

export const getBusinessProfile = async () => {
  const response = await api.get('/business');
  return response.data;
};

export const updateBusinessProfile = async (data) => {
  const response = await api.put('/business', data);
  return response.data;
};

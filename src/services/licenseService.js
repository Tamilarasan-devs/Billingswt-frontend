import api from './api';

export const getLicenses = async () => {
  const response = await api.get('/licenses');
  return response.data;
};

export const generateLicenses = async (data) => {
  const response = await api.post('/licenses/generate', data);
  return response.data;
};

export const toggleLicenseStatus = async (id) => {
  const response = await api.patch(`/licenses/${id}/toggle`);
  return response.data;
};

export const renewLicense = async (licenseKey) => {
  const response = await api.post('/auth/renew-license', { licenseKey });
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/licenses/users');
  return response.data;
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://myapp-backend-8yap.onrender.com';

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const token = await AsyncStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const getNotes = () => apiRequest('/notes/');
export const uploadNote = (formData) => AsyncStorage.getItem('token').then(token =>
  fetch(`${BASE_URL}/notes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(r => r.json())
);
export const deleteNote = (id) => apiRequest(`/notes/${id}`, 'DELETE');

export const generatePlan = (data) => apiRequest('/planner/generate', 'POST', data);
export const getLatestPlan = () => apiRequest('/planner/');

export const getProgress = () => apiRequest('/progress/');
export const updateProgress = (data) => apiRequest('/progress/update', 'POST', data);

export const generateTest = (data) => apiRequest('/mocktest/generate', 'POST', data);
export const submitTest = (data) => apiRequest('/mocktest/submit', 'POST', data);
export const getTests = () => apiRequest('/mocktest/');

export const sendChatMessage = (message) => apiRequest('/chat/message', 'POST', { message });
export const getChatHistory = () => apiRequest('/chat/history');
export const clearChatHistory = () => apiRequest('/chat/history', 'DELETE');
export const getRecommendations = () => apiRequest('/mocktest/recommendations');
export const generateGeneticTimetable = (data) => apiRequest('/planner/genetic-timetable', 'POST', data);

export const getProfile = () => apiRequest('/auth/profile');
export const updateProfile = (data) => apiRequest('/auth/profile', 'PUT', data);

export const getUserProfile = () => apiRequest('/auth/profile');
export const resetProgress = (planId) => apiRequest(`/progress/reset/${planId}`, 'DELETE');
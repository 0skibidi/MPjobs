import api from '../api/axios';

// Example API call
const fetchData = async () => {
  try {
    const response = await api.get('/your-endpoint');
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}; 
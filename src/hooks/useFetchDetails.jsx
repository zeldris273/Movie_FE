import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetchDetails = (mediaType, id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi endpoint mới: /api/movies/{id}/{title} hoặc /api/tvseries/{id}/{title}
        // Vì backend bỏ qua title, ta dùng placeholder 'details'
        const endpoint =
          mediaType === 'movie'
            ? `/api/movies/${id}/details`
            : `/api/tvseries/${id}/details`;
        const response = await axios.get(`http://localhost:5116${endpoint}`);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mediaType, id]);

  return { data, loading, error };
};

export default useFetchDetails;
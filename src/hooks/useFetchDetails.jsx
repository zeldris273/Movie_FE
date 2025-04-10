import { useState, useEffect } from "react";
import axios from "axios";

const useFetchDetails = (mediaType, id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi đúng endpoint: /api/movie/{id} hoặc /api/tvseries/{id}
        const endpoint =
          mediaType === "movie" ? `/api/movie/${id}` : `/api/tvseries/${id}`;
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
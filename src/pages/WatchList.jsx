import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const showAlert = (title, text, icon) => {
    Swal.fire({
      title,
      text,
      icon,
      background: "#222222",
      color: "#fff",
      confirmButtonColor: "#ffcc00",
    });
  };

  const fetchWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view your watch list.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("http://localhost:5116/api/watchlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWatchlist(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
      setError(err.response?.data?.error || "Failed to load watch list.");
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (mediaId, mediaType) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlert("", "Please log in to remove from watch list.", "warning");
      navigate("/auth");
      return;
    }

    try {
      await axios.delete("http://localhost:5116/api/watchlist/remove", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          MediaId: mediaId,
          MediaType: mediaType,
        },
      });
      setWatchlist(watchlist.filter(item => !(item.mediaId === mediaId && item.mediaType === mediaType)));
      showAlert("", "Removed from Watch List!", "success");
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      showAlert("", err.response?.data?.error || "Failed to remove from watch list.", "error");
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleCardClick = (mediaId, mediaType) => {
    const path = mediaType === "movie" ? `/movies/${mediaId}` : `/tv/${mediaId}`;
    navigate(path);
  };

  if (loading) {
    return <div className="text-white text-center py-16">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center py-16">Error: {error}</div>;
  }

  return (
    <div className="py-16 bg-neutral-900 min-h-screen">
      <div className="container mx-auto px-5">
        <h2 className="text-3xl lg:text-2xl font-bold text-white mb-8">
          My Watch List
        </h2>

        {watchlist.length === 0 ? (
          <div className="text-white text-center text-lg">
            Your watch list is empty. Start adding movies and TV series!
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,230px)] gap-6 justify-center lg:justify-start">
            {watchlist.map((item) => (
              <div
                key={`${item.mediaType}-${item.mediaId}`}
                className="relative group"
              >
                <div
                  onClick={() => handleCardClick(item.mediaId, item.mediaType)}
                  className="cursor-pointer"
                >
                  <img
                    src={item.posterUrl || "https://via.placeholder.com/230x345"}
                    alt={item.title}
                    className="w-full h-60 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                  />
                  <h3 className="text-white mt-2 text-center text-sm font-medium">
                    {item.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleRemoveFromWatchlist(item.mediaId, item.mediaType)}
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
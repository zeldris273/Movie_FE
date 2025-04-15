import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const MoviePlayer = () => {
  const { seriesId, episodeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(location.state?.videoUrl || null);
  const [episodes, setEpisodes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("MoviePlayer mounted with params:", { seriesId, episodeId });
    console.log("Video URL from location.state:", location.state?.videoUrl);

    const fetchEpisodes = async () => {
      try {
        console.log("Fetching seasons for series ID:", seriesId);
        const seasonResponse = await axios.get(
          `http://localhost:5116/api/tvseries/${seriesId}/seasons`
        );
        const seasons = seasonResponse.data;
        console.log("Seasons response:", seasons);

        if (seasons.length > 0) {
          console.log("Fetching episodes for season ID:", seasons[0].id);
          const episodesResponse = await axios.get(
            `http://localhost:5116/api/tvseries/seasons/${seasons[0].id}/episodes`
          );
          console.log("Episodes response:", episodesResponse.data);
          setEpisodes(episodesResponse.data);

          // Nếu không có videoUrl từ location.state, lấy từ episodes
          if (!videoUrl && episodesResponse.data.length > 0) {
            const currentEpisode = episodesResponse.data.find(
              (ep) => ep.id === parseInt(episodeId)
            );
            if (currentEpisode) {
              console.log(
                "Setting video URL from episodes:",
                currentEpisode.videoUrl
              );
              setVideoUrl(currentEpisode.videoUrl);
            }
          }
        } else {
          console.log("No seasons found for this series.");
          setError("No seasons found for this series.");
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
        if (err.response) {
          console.log("Error response status:", err.response.status);
          console.log("Error response data:", err.response.data);
          setError(
            "Failed to load episodes: " +
              (err.response.data?.error || err.message)
          );
        } else {
          console.log("Error message:", err.message);
          setError("Failed to load episodes due to network or server error.");
        }
      }
    };

    const fetchComments = () => {
      setComments([
        {
          id: 1,
          user: "User1",
          text: "Phim hay quá!",
          timestamp: "2025-04-15 10:00",
        },
        {
          id: 2,
          user: "User2",
          text: "Tập này hồi hộp thật!",
          timestamp: "2025-04-15 10:05",
        },
      ]);
    };

    fetchEpisodes();
    fetchComments();
  }, [seriesId, episodeId, videoUrl]);

  const handleEpisodeChange = (episode) => {
    console.log("Changing to episode:", episode);
    setVideoUrl(episode.videoUrl);
    navigate(`/tv/${seriesId}/${episode.id}`, {
      state: { videoUrl: episode.videoUrl },
    });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentObj = {
      id: comments.length + 1,
      user: "CurrentUser",
      text: newComment,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    setComments([...comments, newCommentObj]);
    setNewComment("");
  };

  if (error) {
    console.log("Error in MoviePlayer:", error);
    return <div className="text-white text-center">{error}</div>;
  }

  if (!videoUrl) {
    console.log("No video URL provided yet, waiting for episodes...");
    return <div className="text-white text-center">Loading video...</div>;
  }

  return (
    <div className="bg-neutral-900 min-h-screen text-white">
      <div className="container mx-auto p-4">
        <div className="relative w-full" style={{ paddingTop: "40%" }}>
          <video
            key={videoUrl}
            controls
            autoPlay
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            onError={(e) => console.error("Video playback error:", e)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Episodes</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {episodes.length > 0 ? (
            episodes.map((episode) => (
              <div
                key={episode.id}
                onClick={() => handleEpisodeChange(episode)}
                className={`flex-shrink-0 w-30 p-2 rounded-lg cursor-pointer transition-all ${
                  episode.id === parseInt(episodeId)
                    ? "bg-sky-600 border-sky-300"
                    : "bg-slate-700 hover:bg-slate-600 border-slate-600"
                }`}
              >
                <h3 className="text-sm font-semibold text-center">
                  Episode {episode.episodeNumber}
                </h3>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No episodes available.</p>
          )}
        </div>
      </div>

      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-500 transition-all"
            >
              Post
            </button>
          </div>
        </form>
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-gray-800 rounded-lg flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{comment.user}</span>
                  <span className="text-gray-400 text-sm">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-gray-300">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;

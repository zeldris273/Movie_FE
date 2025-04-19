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
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null); // Theo dõi trạng thái menu ba chấm

  // Giả lập ID người dùng hiện tại (có thể lấy từ context/auth)
  const currentUserId = 1;

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

    const fetchComments = async () => {
      try {
        const response = await axios.get("http://localhost:5116/api/comments", {
          params: { tvSeriesId: seriesId, episodeId }
        });
        console.log("Comments response:", response.data);
        setComments(response.data);
      } catch (err) {
        console.error("Error fetching comments:", err);
        if (err.response) {
          setError(
            "Failed to load comments: " +
              (err.response.data?.error || err.message)
          );
        } else {
          setError("Failed to load comments due to network or server error.");
        }
      }
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post("http://localhost:5116/api/comments", {
        userId: currentUserId,
        tvSeriesId: parseInt(seriesId),
        episodeId: parseInt(episodeId),
        commentText: newComment
      });
      setComments([...comments, { ...response.data, replies: [] }]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      if (err.response) {
        setError(
          "Failed to add comment: " +
            (err.response.data?.error || err.message)
        );
      } else {
        setError("Failed to add comment due to network or server error.");
      }
    }
  };

  const handleReplyComment = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const response = await axios.post("http://localhost:5116/api/comments", {
        userId: currentUserId,
        tvSeriesId: parseInt(seriesId),
        episodeId: parseInt(episodeId),
        parentCommentId: parentCommentId,
        commentText: replyText
      });

      const updatedComments = comments.map((comment) => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...comment.replies, response.data]
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setReplyText("");
      setReplyCommentId(null);
    } catch (err) {
      console.error("Error replying to comment:", err);
      if (err.response) {
        setError(
          "Failed to reply to comment: " +
            (err.response.data?.error || err.message)
        );
      } else {
        setError("Failed to reply to comment due to network or server error.");
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditCommentId(comment.id);
    setEditCommentText(comment.commentText);
    setMenuOpen(null); // Đóng menu sau khi chọn "Sửa"
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;

    try {
      const response = await axios.put(
        `http://localhost:5116/api/comments/${commentId}`,
        {
          userId: currentUserId,
          commentText: editCommentText
        }
      );

      const updateComments = (commentsList) =>
        commentsList.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, commentText: response.data.commentText };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            };
          }
          return comment;
        });

      setComments(updateComments(comments));
      setEditCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error("Error updating comment:", err);
      if (err.response) {
        setError(
          "Failed to update comment: " +
            (err.response.data || err.message)
        );
      } else {
        setError("Failed to update comment due to network or server error.");
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5116/api/comments/${commentId}`, {
        params: { userId: currentUserId }
      });

      const removeComment = (commentsList) =>
        commentsList
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies ? removeComment(comment.replies) : []
          }));

      setComments(removeComment(comments));
      setMenuOpen(null); // Đóng menu sau khi chọn "Xóa"
    } catch (err) {
      console.error("Error deleting comment:", err);
      if (err.response) {
        setError(
          "Failed to delete comment: " +
            (err.response.data || err.message)
        );
      } else {
        setError("Failed to delete comment due to network or server error.");
      }
    }
  };

  const toggleMenu = (commentId) => {
    setMenuOpen(menuOpen === commentId ? null : commentId);
  };

  const renderComments = (commentsList, level = 0) => {
    return commentsList.map((comment) => (
      <div
        key={comment.id}
        className={`p-4 bg-gray-800 rounded-lg flex flex-col space-y-1 ${
          level > 0 ? "ml-8 border-l-2 border-gray-700" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{comment.username}</span>
            <span className="text-gray-400 text-sm">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
          </div>
          {comment.userId === currentUserId && (
            <div className="relative">
              <button
                onClick={() => toggleMenu(comment.id)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v.01M12 12v.01M12 18v.01"
                  />
                </svg>
              </button>
              {menuOpen === comment.id && (
                <div className="absolute right-0 mt-2 w-32 bg-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded-t-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded-b-lg"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editCommentId === comment.id ? (
          <form
            onSubmit={(e) => handleUpdateComment(e, comment.id)}
            className="flex items-center space-x-2 mt-2"
          >
            <input
              type="text"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-sky-600 rounded-lg hover:bg-sky-500"
            >
              Save
            </button>
            <button
              onClick={() => setEditCommentId(null)}
              className="px-3 py-1 bg-gray-600 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </form>
        ) : (
          <p className="text-gray-300">{comment.commentText}</p>
        )}

        <button
          onClick={() =>
            setReplyCommentId(replyCommentId === comment.id ? null : comment.id)
          }
          className="text-sky-400 hover:text-sky-300 text-sm mt-1 self-start"
        >
          {replyCommentId === comment.id ? "Cancel Reply" : "Reply"}
        </button>

        {replyCommentId === comment.id && (
          <form
            onSubmit={(e) => handleReplyComment(e, comment.id)}
            className="flex items-center space-x-2 mt-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-sky-600 rounded-lg hover:bg-sky-500"
            >
              Post Reply
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">{renderComments(comment.replies, level + 1)}</div>
        )}
      </div>
    ));
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
            renderComments(comments)
          ) : (
            <p className="text-gray-400 text-center">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
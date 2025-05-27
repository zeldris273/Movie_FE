import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { MdOutlineForward5 } from "react-icons/md";
import { MdReplay5 } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiVolumeMuteFill } from "react-icons/ri";
import { FaVolumeUp } from "react-icons/fa";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import Hls from "hls.js";
import { MdSignalCellularAlt, MdSchedule, MdClose } from "react-icons/md";
import { jwtDecode } from "jwt-decode";

const MoviePlayer = () => {
  const { id, title, episodeNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false); // Chỉ đổi khi người dùng nhấp
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsTab, setSettingsTab] = useState("quality");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const settingsMenuTimeoutRef = useRef(null);

  const mediaType = location.pathname.includes("movies") ? "movie" : "tv";

  // Tạo key duy nhất để lưu thời gian dựa trên id và episodeNumber (nếu có)
  const getStorageKey = () => {
    return mediaType === "movie"
      ? `watchTime_${id}`
      : `watchTime_${id}_episode_${episodeNumber}`;
  };

  // Kiểm tra thời gian xem từ localStorage khi component mount
  useEffect(() => {
    const savedTime = localStorage.getItem(getStorageKey());
    if (savedTime) {
      setSavedTime(parseFloat(savedTime));
      setShowResumePrompt(true); // Hiển thị thông báo
    }
  }, [id, episodeNumber, mediaType]);

  // Xử lý khi người dùng chọn tiếp tục xem
  const handleResume = () => {
    const video = videoRef.current;
    if (video && savedTime) {
      video.currentTime = savedTime;
      setCurrentTime(savedTime);
      video.play().catch((err) => {
        console.error("Play failed:", err.message);
        setError("Failed to play video. Please click play manually.");
      });
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  // Xử lý khi người dùng chọn xem từ đầu
  const handleStartOver = () => {
    localStorage.removeItem(getStorageKey());
    setCurrentTime(0);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch((err) => {
        console.error("Play failed:", err.message);
        setError("Failed to play video. Please click play manually.");
      });
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userId =
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ];
        setCurrentUserId(parseInt(userId, 10));
      } catch (err) {
        console.error("Error decoding token:", err);
        setError("Invalid token. Please log in again.");
        navigate("/auth");
      }
    } else {
      setError("You are not logged in. Please log in to continue.");
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const endpoint =
          mediaType === "movie"
            ? `/api/movies/${id}/${title}/watch`
            : `/api/tvseries/${id}/${title}/episode/${episodeNumber}/watch`;
        console.log("Fetching video URL from:", endpoint);
        const response = await api.get(endpoint);
        console.log("Video URL received:", response.data.videoUrl);
        setVideoUrl(response.data.videoUrl);
      } catch (err) {
        console.error("Error fetching video URL:", err.response || err);
        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            "Failed to load video: " +
              (err.response?.data?.error || err.message)
          );
        }
      }
    };

    const fetchEpisodes = async () => {
      if (mediaType !== "tv") return;

      try {
        const seasonResponse = await api.get(`/api/tvseries/${id}/seasons`);
        const seasons = seasonResponse.data;

        if (seasons.length > 0) {
          const episodesResponse = await api.get(
            `/api/tvseries/seasons/${seasons[0].id}/episodes`
          );
          setEpisodes(episodesResponse.data);
        } else {
          setError("No seasons found for this series.");
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
        setError(
          "Failed to load episodes: " +
            (err.response?.data?.error || err.message)
        );
      }
    };

    const fetchComments = async () => {
      try {
        const episodeId = mediaType === "tv" ? getEpisodeId() : null;
        const response = await api.get("/api/comments", {
          params: {
            tvSeriesId: mediaType === "tv" ? id : null,
            movieId: mediaType === "movie" ? id : null,
            episodeId: episodeId,
          },
        });
        setComments(response.data);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError(
          "Failed to load comments: " +
            (err.response?.data?.error || err.message)
        );
      }
    };

    fetchVideoUrl();
    fetchEpisodes();
    fetchComments();
  }, [id, title, episodeNumber, mediaType]);

  const getEpisodeId = () => {
    if (mediaType !== "tv" || !episodeNumber || episodes.length === 0)
      return null;

    const epNum = parseInt(episodeNumber.replace("episode-", "") || "0", 10);
    const episode = episodes.find(
      (ep) => (ep.episode_number || ep.episodeNumber) === epNum
    );
    return episode ? episode.id : null;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      console.log("Video or URL not ready:", { video, videoUrl });
      return;
    }

    console.log("Video element dimensions:", {
      width: video.offsetWidth,
      height: video.offsetHeight,
    });

    if (Hls.isSupported()) {
      console.log("HLS supported, loading source:", videoUrl);
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Manifest parsed, quality levels:", hls.levels);
        setQualityLevels(hls.levels);
        setSelectedQuality(hls.currentLevel);
        // Không tự động play, chờ người dùng nhấp
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log("Switched to quality level:", data.level);
        setSelectedQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error: Failed to load HLS stream.");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error: Failed to play HLS stream.");
              break;
            default:
              setError("An error occurred while playing the HLS stream.");
              break;
          }
        }
      });

      if (videoRef.current) {
        videoRef.current.hls = hls;
      }

      return () => {
        if (videoRef.current && videoRef.current.hls) {
          videoRef.current.hls.destroy();
          videoRef.current.hls = null;
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("Using native HLS:", videoUrl);
      video.src = videoUrl;
      // Không tự động play, chờ người dùng nhấp
    } else {
      setError("HLS is not supported in this browser.");
    }
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      localStorage.setItem(getStorageKey(), video.currentTime.toString());
    };

    const setVideoDuration = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      localStorage.removeItem(getStorageKey());
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", setVideoDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    video.playbackRate = playbackRate;
    video.muted = isMuted;

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", setVideoDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoUrl, playbackRate, isMuted]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    if (showSettingsMenu) {
      settingsMenuTimeoutRef.current = setTimeout(() => {
        setShowSettingsMenu(false);
      }, 3000);
    }

    return () => {
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    };
  }, [showSettingsMenu]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.error("Play failed:", err.message);
        setError("Failed to play video. Please click play manually.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const seekTime = (e.target.value / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    localStorage.setItem(getStorageKey(), seekTime.toString());
  };

  const handleQualityChange = (level) => {
    const hls = videoRef.current?.hls;
    if (hls) {
      hls.currentLevel = level;
      setSelectedQuality(level);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
  };

  const handleEpisodeChange = (episode) => {
    const slug = title;
    const newEpisodeNumber =
      episode.episode_number || episode.episodeNumber || 1;
    navigate(`/tvseries/${id}/${slug}/episode/${newEpisodeNumber}/watch`, {
      state: { videoUrl: episode.videoUrl },
    });
    setVideoUrl(episode.videoUrl);
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu(!showSettingsMenu);
    if (settingsMenuTimeoutRef.current) {
      clearTimeout(settingsMenuTimeoutRef.current);
    }
  };

  const switchSettingsTab = (tab) => {
    setSettingsTab(tab);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
          setError("Full-screen mode is not supported or blocked.");
        })
        .then(() => {
          setIsFullScreen(true);
          const video = videoRef.current;
          if (video) {
            video.style.width = "100%";
            video.style.height = "100%";
          }
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
        const video = videoRef.current;
        if (video) {
          video.style.width = "";
          video.style.height = "";
        }
      });
    }
  };

  const handleSkipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(video.currentTime + 5, duration);
      setCurrentTime(video.currentTime);
      localStorage.setItem(getStorageKey(), video.currentTime.toString());
    }
  };

  const handleSkipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(video.currentTime - 5, 0);
      setCurrentTime(video.currentTime);
      localStorage.setItem(getStorageKey(), video.currentTime.toString());
    }
  };

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const episodeId = mediaType === "tv" ? getEpisodeId() : null;

    try {
      const response = await api.post("/api/comments", {
        userId: currentUserId,
        tvSeriesId: mediaType === "tv" ? parseInt(id) : null,
        movieId: mediaType === "movie" ? parseInt(id) : null,
        episodeId: episodeId,
        commentText: newComment,
      });
      setComments([...comments, { ...response.data, replies: [] }]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err.message);
      setError(
        `Failed to add comment: ${
          err.response?.data?.error || err.response?.statusText || err.message
        }`
      );
    }
  };

  const handleReplyComment = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const episodeId = mediaType === "tv" ? getEpisodeId() : null;

    try {
      const response = await api.post("/api/comments", {
        userId: currentUserId,
        tvSeriesId: mediaType === "tv" ? parseInt(id) : null,
        movieId: mediaType === "movie" ? parseInt(id) : null,
        episodeId: episodeId,
        parentCommentId: parentCommentId,
        commentText: replyText,
      });

      const updatedComments = comments.map((comment) => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...comment.replies, response.data],
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setReplyText("");
      setReplyCommentId(null);
    } catch (err) {
      console.error("Error replying to comment:", err);
      setError(
        "Failed to reply to comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const handleEditComment = (comment) => {
    setEditCommentId(comment.id);
    setEditCommentText(comment.commentText);
    setMenuOpen(null);
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/api/comments/${commentId}`, {
        userId: currentUserId,
        commentText: editCommentText,
      });

      const updateComments = (commentsList) =>
        commentsList.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, commentText: response.data.commentText };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies),
            };
          }
          return comment;
        });

      setComments(updateComments(comments));
      setEditCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error("Error updating comment:", err);
      setError(
        "Failed to update comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`, {
        params: { userId: currentUserId },
      });

      const removeComment = (commentsList) =>
        commentsList
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies ? removeComment(comment.replies) : [],
          }));

      setComments(removeComment(comments));
      setMenuOpen(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(
        "Failed to delete comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const toggleMenu = (commentId) => {
    setMenuOpen(menuOpen === commentId ? null : commentId);
  };

  const renderComments = (commentsList, level = 0) => {
    return commentsList.map((comment) => (
      <div
        key={comment.id}
        className={`p-2 sm:p-4 bg-gray-800 rounded-lg flex flex-col space-y-1 ${
          level > 0 ? "ml-4 sm:ml-8 border-l-2 border-gray-700" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm sm:text-base">
              {comment.username}
            </span>
            <span className="text-gray-400 text-xs sm:text-sm">
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
                  className="w-4 sm:w-5 h-4 sm:h-5"
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
                <div className="absolute right-0 mt-2 w-24 sm:w-32 bg-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-600 rounded-t-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-600 rounded-b-lg"
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
            className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2"
          >
            <input
              type="text"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="flex-1 p-1 sm:p-2 rounded-lg bg-gray-700 text-white text-xs sm:text-sm border border-gray-600 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-xs sm:text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditCommentId(null)}
              className="px-2 sm:px-3 py-1 bg-gray-600 rounded-lg hover:bg-gray-500 text-xs sm:text-sm"
            >
              Cancel
            </button>
          </form>
        ) : (
          <p className="text-gray-300 text-sm sm:text-base">
            {comment.commentText}
          </p>
        )}

        <button
          onClick={() =>
            setReplyCommentId(replyCommentId === comment.id ? null : comment.id)
          }
          className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm mt-1 self-start"
        >
          {replyCommentId === comment.id ? "Cancel Reply" : "Reply"}
        </button>

        {replyCommentId === comment.id && (
          <form
            onSubmit={(e) => handleReplyComment(e, comment.id)}
            className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 p-1 sm:p-2 rounded-lg bg-gray-700 text-white text-xs sm:text-sm border border-gray-600 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-xs sm:text-sm"
            >
              Post Reply
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 sm:mt-2">
            {renderComments(comment.replies, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="mt-15 text-white text-center p-4">
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            setVideoUrl(null);
          }}
          className="ml-2 px-2 py-1 bg-yellow-500 rounded text-sm hover:bg-yellow-400"
        >
          Retry
        </button>
        <button
          onClick={() => navigate("/")}
          className="ml-2 px-2 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!videoUrl) {
    return <div className="text-white text-center p-4">Loading video...</div>;
  }

  if (!currentUserId) {
    return <div className="text-white text-center p-4">Authenticating...</div>;
  }

  return (
    <div className="bg-neutral-900 min-h-screen text-white">
      {showResumePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-80 sm:w-96 text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
              Resume Playback
            </h3>
            <p className="text-sm sm:text-base mb-4 sm:mb-6">
              You previously watched up to {formatTime(savedTime)}. Would you
              like to resume from there?
            </p>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <button
                onClick={handleResume}
                className="px-4 sm:px-6 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-sm sm:text-base"
              >
                Resume
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 sm:px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm sm:text-base"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`container mx-auto p-2 sm:p-4 my-2 sm:my-10 ${
          isFullScreen ? "fixed top-0 left-0 w-screen h-screen" : ""
        }`}
        style={{ width: "80%", height: "auto", margin: "0 auto" }}
        onMouseMove={handleMouseMove}
      >
        <div
          className="relative w-full"
          style={{ paddingTop: isFullScreen ? "0" : "56.25%" }}
        >
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            onClick={handlePlayPause}
            controls={false}
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                handleSkipBackward(); 
              } else if (e.key === "ArrowRight") {
                handleSkipForward(); 
              }
            }}
            tabIndex={0}
          />

          {showControls && (
            <div
              className={`absolute bottom-0 left-0 right-0 ${
                isFullScreen ? "p-2 sm:p-4" : "p-1 sm:p-2"
              } bg-transparent`}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <div className="text-white text-xs sm:text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-transparent rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #facc15 ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%, transparent ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-1 sm:mt-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={handlePlayPause}
                    className="text-white text-lg sm:text-xl hover:bg-transparent p-1 rounded-full"
                  >
                    {isPlaying ? (
                      <svg
                        className="w-4 sm:w-6 h-4 sm:h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 sm:w-6 h-4 sm:h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="text-white text-lg sm:text-xl hover:bg-transparent p-1 rounded-full"
                  >
                    {isMuted ? <RiVolumeMuteFill /> : <FaVolumeUp />}
                  </button>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={handleSkipBackward}
                      className="text-white hover:bg-transparent p-1 rounded-full text-lg sm:text-xl"
                    >
                      <MdReplay5 />
                    </button>
                    <button
                      onClick={handleSkipForward}
                      className="text-white hover:bg-transparent p-1 rounded-full text-lg sm:text-xl"
                    >
                      <MdOutlineForward5 />
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      onClick={toggleSettingsMenu}
                      className="text-white hover:bg-transparent p-1 rounded-full text-lg sm:text-xl"
                    >
                      <IoMdSettings />
                    </button>
                    {showSettingsMenu && (
                      <div className="absolute bottom-8 sm:bottom-12 right-0 w-40 sm:w-56 bg-[#1e1e1e] text-white rounded-md shadow-lg z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-2 bg-black">
                          <div className="flex space-x-2 sm:space-x-4">
                            <button
                              onClick={() => switchSettingsTab("quality")}
                              className={`flex items-center text-xs sm:text-sm ${
                                settingsTab === "quality"
                                  ? "border-b-2 border-white"
                                  : "text-gray-400"
                              }`}
                            >
                              <MdSignalCellularAlt className="text-base sm:text-lg mr-1" />
                            </button>
                            <button
                              onClick={() => switchSettingsTab("speed")}
                              className={`flex items-center text-xs sm:text-sm ${
                                settingsTab === "speed"
                                  ? "border-b-2 border-white"
                                  : "text-gray-400"
                              }`}
                            >
                              <MdSchedule className="text-base sm:text-lg" />
                            </button>
                          </div>
                          <button
                            onClick={() => setShowSettingsMenu(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            <MdClose className="text-base sm:text-xl" />
                          </button>
                        </div>

                        <div className="py-1 sm:py-2 px-2 sm:px-3 space-y-0.5 sm:space-y-1 text-xs sm:text-sm bg-[#2b2b2b]">
                          {settingsTab === "quality" && (
                            <>
                              <button
                                onClick={() => handleQualityChange(-1)}
                                className={`block w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded ${
                                  selectedQuality === -1
                                    ? "text-white font-bold"
                                    : "text-gray-300"
                                } hover:bg-gray-700`}
                              >
                                Auto
                              </button>
                              {qualityLevels.map((level, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQualityChange(index)}
                                  className={`block w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded ${
                                    selectedQuality === index
                                      ? "text-white font-bold"
                                      : "text-gray-300"
                                  } hover:bg-gray-700`}
                                >
                                  {level.height}p
                                </button>
                              ))}
                            </>
                          )}
                          {settingsTab === "speed" && (
                            <>
                              {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => handlePlaybackRateChange(rate)}
                                  className={`block w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded ${
                                    playbackRate === rate
                                      ? "text-white font-bold"
                                      : "text-gray-300"
                                  } hover:bg-gray-700`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={toggleFullScreen}
                    className="text-white hover:bg-transparent p-1 rounded-full text-lg sm:text-2xl"
                  >
                    {isFullScreen ? <MdFullscreenExit /> : <MdFullscreen />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {mediaType === "tv" && (
        <div className="container mx-auto p-2 sm:p-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
            Episodes
          </h2>
          <div className="flex overflow-x-auto space-x-2 sm:space-x-4 pb-2 sm:pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {episodes.length > 0 ? (
              episodes.map((episode) => {
                const currentEpisodeNumber =
                  episode.episode_number || episode.episodeNumber || 1;
                const isActive =
                  episodeNumber &&
                  currentEpisodeNumber.toString() ===
                    episodeNumber.replace("episode-", "");
                return (
                  <div
                    key={episode.id}
                    onClick={() => handleEpisodeChange(episode)}
                    className={`flex-shrink-0 w-16 sm:w-30 p-1 sm:p-2 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-yellow-500 border-yellow-300"
                        : "bg-slate-700 hover:bg-slate-600 border-slate-600"
                    }`}
                  >
                    <h3 className="text-xs sm:text-sm font-semibold text-center">
                      Episode {currentEpisodeNumber}
                    </h3>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No episodes available.</p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto p-2 sm:p-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Comments</h2>
        <form onSubmit={handleAddComment} className="mb-3 sm:mb-6">
          <div className="flex items-center space-x-1 sm:space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-2 sm:p-3 rounded-lg bg-gray-800 text-white text-sm sm:text-base border border-gray-700 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-4 py-1 sm:py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400 transition-all text-sm sm:text-base"
            >
              Post
            </button>
          </div>
        </form>
        <div className="space-y-2 sm:space-y-4">
          {comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <p className="text-gray-400 text-center text-sm sm:text-base">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;

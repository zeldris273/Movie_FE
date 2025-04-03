import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const MoviePlayer = () => {
  const { movieId, episodeId } = useParams(); // Lấy movieId và episodeId từ URL
  const [movie, setMovie] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lấy thông tin phim và tập phim từ API
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await axios.get(`http://localhost:5116/api/movies/${movieId}`);
        const movieData = response.data;
        setMovie(movieData);

        // Tìm tập phim hiện tại
        const episode = movieData.episodes.find((ep) => ep.id === parseInt(episodeId));
        setCurrentEpisode(episode || movieData.episodes[0]); // Nếu không tìm thấy, mặc định là tập đầu tiên
      } catch (error) {
        console.error("Lỗi khi lấy thông tin phim:", error);
      }
    };
    fetchMovie();
  }, [movieId, episodeId]);

  // Cập nhật tiến trình video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress(progressPercent);
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Điều khiển phát/tạm dừng
  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Tua video
  const handleSeek = (e) => {
    const video = videoRef.current;
    const seekTime = (e.target.value / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(e.target.value);
  };

  // Điều chỉnh âm lượng
  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const newVolume = e.target.value;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  // Chuyển toàn màn hình
  const toggleFullscreen = () => {
    const videoContainer = videoRef.current.parentElement;
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Chuyển tập phim
  const handleEpisodeChange = (episode) => {
    setCurrentEpisode(episode);
    setIsPlaying(false);
    setProgress(0);
  };

  if (!movie || !currentEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm1-4c-1.1 0-2-.9-2-2V7h4v4c0 1.1-.9 2-2 2z" />
              </svg>
              MOVIE
            </h1>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                TV Shows
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                Movies
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search here..."
                className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 10a3 3 0 100-6 3 3 0 000 6zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                src={currentEpisode.videoUrl} // URL video từ S3
                className="w-full h-auto"
                onClick={togglePlay}
              />
              {/* Điều khiển video */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 p-4 flex items-center space-x-4">
                <button onClick={togglePlay} className="text-white">
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3l12 7-12 7V3z" />
                    </svg>
                  )}
                </button>
                {/* Thanh tiến trình */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                {/* Âm lượng */}
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 7v6h5l6 6V1L8 7H3z" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                {/* Toàn màn hình */}
                <button onClick={toggleFullscreen} className="text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 3h4v2H5v2H3V3zm0 14h4v-2H5v-2H3v4zm14-14h-4v2h2v2h2V3zm0 14h-4v-2h2v-2h2v4z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Thông tin phim */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold">{movie.title}</h2>
              <p className="text-gray-400">Episode {currentEpisode.episodeNumber}</p>
              <p className="text-gray-300 mt-2">{movie.overview}</p>
            </div>
          </div>

          {/* Danh sách tập phim */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Episodes</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {movie.episodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => handleEpisodeChange(episode)}
                    className={`w-full text-left p-3 rounded-lg transition duration-200 ${
                      episode.id === currentEpisode.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Episode {episode.episodeNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MoviePlayer;
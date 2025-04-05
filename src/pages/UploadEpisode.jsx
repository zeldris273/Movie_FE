import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function UploadEpisode() {
  const [formData, setFormData] = useState({
    tvSeriesId: "",
    seasonId: "",
    episodeNumber: "",
    videoFile: null,
  });
  const [tvSeriesList, setTvSeriesList] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkAdminRole();
    if (isAdmin) {
      fetchTvSeries();
    }
  }, [isAdmin]);

  const checkAdminRole = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: "Lỗi!",
        text: "Bạn chưa đăng nhập!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] === "admin") {
        setIsAdmin(true);
      } else {
        Swal.fire({
          title: "Cảnh báo!",
          text: "Bạn không có quyền upload!",
          icon: "warning",
          background: "#1f2937",
          color: "#fff",
          confirmButtonColor: "#facc15",
        });
      }
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Token không hợp lệ!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    }
  };

  const fetchTvSeries = async () => {
    try {
      const response = await axios.get("http://localhost:5116/api/tvseries");
      setTvSeriesList(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách TV series:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể lấy danh sách TV series!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    }
  };

  const fetchSeasons = async (tvSeriesId) => {
    try {
      const response = await axios.get(`http://localhost:5116/api/tvseries/${tvSeriesId}/seasons`);
      setSeasonsList(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách seasons:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể lấy danh sách seasons!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "tvSeriesId" && value) {
      fetchSeasons(value);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, videoFile: file }));
  };

  const handleUpload = async () => {
    if (!isAdmin) {
      Swal.fire({
        title: "Cảnh báo!",
        text: "Bạn không có quyền upload!",
        icon: "warning",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    const { tvSeriesId, seasonId, episodeNumber, videoFile } = formData;
    if (!tvSeriesId || !seasonId || !episodeNumber || !videoFile) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ thông tin: TV Series, Season, Episode Number, và Video File!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: "Lỗi!",
        text: "Bạn chưa đăng nhập!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append("SeasonId", formData.seasonId);
    uploadData.append("EpisodeNumber", formData.episodeNumber);
    uploadData.append("VideoFile", formData.videoFile);

    try {
      const response = await axios.post(
        "http://localhost:5116/api/tvseries/episodes/upload",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total > 0) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        }
      );

      setVideoUrl(response.data.videoUrl);
      Swal.fire({
        title: "Thành công!",
        text: "Upload episode thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });

      setFormData({
        tvSeriesId: "",
        seasonId: "",
        episodeNumber: "",
        videoFile: null,
      });
      setSeasonsList([]);
      setUploadProgress(0);
    } catch (error) {
      console.error("Lỗi upload:", error);
      const errorMessage = error.response?.data?.error || "Upload thất bại!";
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-lg font-semibold">Bạn không có quyền upload episode!</p>
        </div>
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
              UPLOAD EPISODE
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
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-white">
            Upload Episode
          </h2>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor="tvSeriesId" className="block text-sm font-medium text-gray-400 mb-1">
                TV Series *
              </label>
              <select
                id="tvSeriesId"
                name="tvSeriesId"
                value={formData.tvSeriesId}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                <option value="">Select TV Series</option>
                {tvSeriesList.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seasonId" className="block text-sm font-medium text-gray-400 mb-1">
                Season *
              </label>
              <select
                id="seasonId"
                name="seasonId"
                value={formData.seasonId}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                disabled={!formData.tvSeriesId}
              >
                <option value="">Select Season</option>
                {seasonsList.map((season) => (
                  <option key={season.id} value={season.id}>
                    Season {season.seasonNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="episodeNumber" className="block text-sm font-medium text-gray-400 mb-1">
                Episode Number *
              </label>
              <input
                id="episodeNumber"
                name="episodeNumber"
                type="number"
                value={formData.episodeNumber}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                min="1"
              />
            </div>

            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-gray-400 mb-1">
                Choose Video *
              </label>
              <input
                id="videoFile"
                type="file"
                accept="video/mp4,video/avi,video/mov,video/mp2t"
                onChange={handleVideoChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            Upload Episode
          </button>

          {/* Progress Bar */}
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-center text-sm text-gray-300 mt-1">{uploadProgress}%</p>
            </div>
          )}

          {/* Display Results */}
          {videoUrl && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">Uploaded Video:</h3>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all"
                >
                  {videoUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
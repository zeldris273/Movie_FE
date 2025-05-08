import { useState, useEffect } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function AddEpisode() {
  const [formData, setFormData] = useState({
    tvSeriesId: "",
    seasonId: "",
    episodeNumber: "",
    hlsZipFile: null, // Thay videoFile thành hlsZipFile
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
    const token = localStorage.getItem("accessToken");
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
      const response = await api.get("http://localhost:5116/api/tvseries");
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
      const response = await api.get(`http://localhost:5116/api/tvseries/${tvSeriesId}/seasons`);
      setSeasonsList(response.data);
      if (response.data.length === 0) {
        Swal.fire({
          title: "Thông báo",
          text: "TV series này chưa có season. Season 1 sẽ được tạo tự động khi bạn thêm episode.",
          icon: "info",
          background: "#1f2937",
          color: "#fff",
          confirmButtonColor: "#facc15",
        });
      }
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

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, hlsZipFile: file }));
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

    const { tvSeriesId, episodeNumber, hlsZipFile } = formData;
    if (!tvSeriesId || !episodeNumber || !hlsZipFile) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ thông tin: TV Series, Episode Number, và HLS Zip File!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    const token = localStorage.getItem("accessToken"); // Sửa "token" thành "accessToken" để khớp với checkAdminRole
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
    uploadData.append("TvSeriesId", formData.tvSeriesId);
    uploadData.append("SeasonId", formData.seasonId || 0);
    uploadData.append("EpisodeNumber", formData.episodeNumber);
    uploadData.append("HlsZipFile", formData.hlsZipFile);

    try {
      const response = await api.post(
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
        hlsZipFile: null,
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
      <main className="max-w-2xl mx-auto py-8 px-4 my-5">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-white">
            Upload Episode
          </h2>

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
                Season (Optional - Season 1 will be created if none exists)
              </label>
              <select
                id="seasonId"
                name="seasonId"
                value={formData.seasonId}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                disabled={!formData.tvSeriesId}
              >
                <option value="">Select Season (or leave blank to auto-create)</option>
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
              <label htmlFor="hlsZipFile" className="block text-sm font-medium text-gray-400 mb-1">
                Choose HLS Zip File *
              </label>
              <input
                id="hlsZipFile"
                type="file"
                accept=".zip"
                onChange={handleZipChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            Upload Episode
          </button>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-center text-sm text-gray-300 mt-1">{uploadProgress}%</p>
            </div>
          )}

          {videoUrl && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">Uploaded HLS URL:</h3>
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
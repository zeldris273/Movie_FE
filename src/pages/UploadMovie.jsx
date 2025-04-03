import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function UploadMovie() {
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    genres: [],
    status: "",
    releaseDate: "",
    type: "single_movie", // Chỉ giữ single_movie
    studio: "",
    director: "",
    videoFile: null,
    imageFiles: [],
  });
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkAdminRole();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenresChange = (e) => {
    const genres = e.target.value.split(",").map((g) => g.trim()).filter((g) => g);
    setFormData((prev) => ({ ...prev, genres }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, videoFile: file }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 2) {
      Swal.fire({
        title: "Thông báo!",
        text: "Phải chọn đúng 2 ảnh cho phim lẻ!",
        icon: "info",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }
    setFormData((prev) => ({ ...prev, imageFiles: files }));
  };

  const handleUpload = async () => {
    const { title, status, type, videoFile, imageFiles } = formData;

    // Kiểm tra dữ liệu đầu vào
    if (!title || !status || !type || !videoFile) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ thông tin: Title, Status, Type, và 1 video!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    // Kiểm tra số lượng ảnh (phải đúng 2 ảnh cho phim lẻ)
    if (imageFiles.length !== 2) {
      Swal.fire({
        title: "Lỗi!",
        text: "Phải chọn đúng 2 ảnh cho phim lẻ!",
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
    uploadData.append("Title", formData.title);
    uploadData.append("Overview", formData.overview || "");
    formData.genres.forEach((genre) => uploadData.append("Genres", genre));
    uploadData.append("Status", formData.status);
    if (formData.releaseDate) uploadData.append("ReleaseDate", formData.releaseDate);
    uploadData.append("Type", formData.type);
    uploadData.append("Studio", formData.studio || "");
    uploadData.append("Director", formData.director || "");
    uploadData.append("VideoFile", formData.videoFile);
    formData.imageFiles.forEach((img) => uploadData.append("ImageFiles", img));

    try {
      const response = await axios.post(
        "http://localhost:5116/api/movies/upload",
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
      setImageUrls(response.data.imageUrls || []);
      Swal.fire({
        title: "Thành công!",
        text: "Upload thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });

      // Reset form sau khi upload thành công
      setFormData({
        title: "",
        overview: "",
        genres: [],
        status: "",
        releaseDate: "",
        type: "single_movie",
        studio: "",
        director: "",
        videoFile: null,
        imageFiles: [],
      });
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
          <p className="text-lg font-semibold">Bạn không có quyền upload video!</p>
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
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-white">
            Upload Movie
          </h2>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="overview" className="block text-sm font-medium text-gray-400 mb-1">
                Overview
              </label>
              <textarea
                id="overview"
                name="overview"
                value={formData.overview}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                rows="3"
              />
            </div>

            <div>
              <label htmlFor="genres" className="block text-sm font-medium text-gray-400 mb-1">
                Genres (comma-separated)
              </label>
              <input
                id="genres"
                name="genres"
                type="text"
                value={formData.genres.join(", ")}
                onChange={handleGenresChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="e.g., Action, Drama"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                <option value="">Select Status</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Released">Released</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-400 mb-1">
                Release Date (mm/dd/yyyy)
              </label>
              <input
                id="releaseDate"
                name="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="studio" className="block text-sm font-medium text-gray-400 mb-1">
                Studio
              </label>
              <input
                id="studio"
                name="studio"
                type="text"
                value={formData.studio}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="director" className="block text-sm font-medium text-gray-400 mb-1">
                Director
              </label>
              <input
                id="director"
                name="director"
                type="text"
                value={formData.director}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
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

            <div>
              <label htmlFor="imageFiles" className="block text-sm font-medium text-gray-400 mb-1">
                Choose Images (2 images) *
              </label>
              <input
                id="imageFiles"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleImageChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
              <p className="text-xs text-gray-400 mt-1">Select exactly 2 images</p>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            Upload Movie
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
          {(videoUrl || imageUrls.length > 0) && (
            <div className="space-y-4">
              {videoUrl && (
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
              )}
              {imageUrls.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Uploaded Images:</h3>
                  {imageUrls.map((img, index) => (
                    <a
                      key={index}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:underline break-all"
                    >
                      Image {index + 1}: {img}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function CreateMovie() {
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    genres: "", // Đổi từ mảng sang chuỗi
    status: "",
    releaseDate: "",
    type: "single_movie",
    studio: "",
    director: "",
    videoFile: null,
    backdropFile: null,
    posterFile: null,
  });
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkAdminRole();
  }, []);

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
      if (
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] === "admin"
      ) {
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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, videoFile: file }));
  };

  const handleBackdropChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, backdropFile: file }));
    }
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, posterFile: file }));
    }
  };

  const handleUpload = async () => {
    console.log("FormData before upload:", formData);

    const { title, status, type, videoFile, backdropFile, posterFile } =
      formData;
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

    if (!backdropFile || !posterFile) {
      Swal.fire({
        title: "Lỗi!",
        text: "Phải chọn cả Backdrop và Poster cho phim lẻ!",
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
    uploadData.append("Genres", formData.genres);
    uploadData.append("Status", formData.status);
    if (formData.releaseDate) {
      const releaseDate = new Date(formData.releaseDate);
      uploadData.append("ReleaseDate", releaseDate.toISOString());
    }
    uploadData.append("Type", formData.type);
    uploadData.append("Studio", formData.studio || "");
    uploadData.append("Director", formData.director || "");
    uploadData.append("VideoFile", formData.videoFile);
    uploadData.append("BackdropFile", formData.backdropFile);
    uploadData.append("PosterFile", formData.posterFile);

    // Log FormData entries
    for (let [key, value] of uploadData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await axios.post(
        "http://localhost:5116/api/movies/create",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total > 0) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
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

      setFormData({
        title: "",
        overview: "",
        genres: "",
        status: "",
        releaseDate: "",
        type: "single_movie",
        studio: "",
        director: "",
        videoFile: null,
        backdropFile: null,
        posterFile: null,
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
          <p className="text-lg font-semibold">Bạn không có quyền!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-4 my-10">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-white">
            Create Movie
          </h2>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="overview"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="genres"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Genres (comma-separated)
              </label>
              <input
                id="genres"
                name="genres"
                type="text"
                value={formData.genres}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="e.g., Action, Drama"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="releaseDate"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="studio"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="director"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="videoFile"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
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
              <label
                htmlFor="backdropFile"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Choose Backdrop Image *
              </label>
              <input
                id="backdropFile"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleBackdropChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
              <p className="text-xs text-gray-400 mt-1">
                Select 1 image for Backdrop
              </p>
            </div>

            <div>
              <label
                htmlFor="posterFile"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Choose Poster Image *
              </label>
              <input
                id="posterFile"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePosterChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
              <p className="text-xs text-gray-400 mt-1">
                Select 1 image for Poster
              </p>
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
              <p className="text-center text-sm text-gray-300 mt-1">
                {uploadProgress}%
              </p>
            </div>
          )}

          {/* Display Results */}
          {(videoUrl || imageUrls.length > 0) && (
            <div className="space-y-4">
              {videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">
                    Uploaded Video:
                  </h3>
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
                  <h3 className="text-lg font-semibold text-gray-200">
                    Uploaded Images:
                  </h3>
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

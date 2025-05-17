import { useState, useEffect } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function CreateTvSeries() {
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    genres: [],
    status: "",
    releaseDate: "",
    studio: "",
    director: "",
    posterImageFile: null,
    backdropImageFile: null,
    actors: "", // Thêm trường actors
  });
  const [posterImageUrl, setPosterImageUrl] = useState("");
  const [backdropImageUrl, setBackdropImageUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkAdminRole();
  }, []);

   useEffect(() => {
      window.scrollTo(0, 0);
    }, [location]);
  

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenresChange = (e) => {
    const genres = e.target.value.split(",").map((g) => g.trim()).filter((g) => g);
    setFormData((prev) => ({ ...prev, genres }));
  };

  const handlePosterImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, posterImageFile: file }));
  };

  const handleBackdropImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, backdropImageFile: file }));
  };

  const handleUpload = async () => {
    const { title, status, posterImageFile, backdropImageFile } = formData;
    if (!title || !status || !posterImageFile || !backdropImageFile) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ thông tin: Title, Status, Poster Image, và Backdrop Image!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      return;
    }

    const token = localStorage.getItem("accessToken"); // Sửa "token" thành "accessToken" để đồng bộ với checkAdminRole
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
    uploadData.append("Studio", formData.studio || "");
    uploadData.append("Director", formData.director || "");
    uploadData.append("PosterImageFile", formData.posterImageFile);
    uploadData.append("BackdropImageFile", formData.backdropImageFile);
    uploadData.append("Actors", formData.actors || ""); // Thêm Actors vào FormData

    try {
      const response = await api.post(
        "http://localhost:5116/api/tvseries/create",
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

      setPosterImageUrl(response.data.posterUrl); // Cập nhật tên trường theo response từ backend
      setBackdropImageUrl(response.data.backdropUrl);
      Swal.fire({
        title: "Thành công!",
        text: "Upload TV series thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });

      setFormData({
        title: "",
        overview: "",
        genres: [],
        status: "",
        releaseDate: "",
        studio: "",
        director: "",
        posterImageFile: null,
        backdropImageFile: null,
        actors: "", // Reset trường actors
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
          <p className="text-lg font-semibold">Bạn không có quyền upload TV series!</p>
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
            Upload TV Series
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
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 scrolln-none"
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
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
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
              <label htmlFor="actors" className="block text-sm font-medium text-gray-400 mb-1">
                Actors (comma-separated)
              </label>
              <input
                id="actors"
                name="actors"
                type="text"
                value={formData.actors}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="e.g., Actor 1, Actor 2, Actor 3"
              />
            </div>

            <div>
              <label htmlFor="posterImageFile" className="block text-sm font-medium text-gray-400 mb-1">
                Choose Poster Image *
              </label>
              <input
                id="posterImageFile"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePosterImageChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="backdropImageFile" className="block text-sm font-medium text-gray-400 mb-1">
                Choose Backdrop Image *
              </label>
              <input
                id="backdropImageFile"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleBackdropImageChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200"
              />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            Upload TV Series
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
          {(posterImageUrl || backdropImageUrl) && (
            <div className="space-y-4">
              {posterImageUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Uploaded Poster Image:</h3>
                  <a
                    href={posterImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all"
                  >
                    {posterImageUrl}
                  </a>
                </div>
              )}
              {backdropImageUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Uploaded Backdrop Image:</h3>
                  <a
                    href={backdropImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all"
                  >
                    {backdropImageUrl}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
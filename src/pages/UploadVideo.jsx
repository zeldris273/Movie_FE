import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export default function UploadVideo() {
  const [video, setVideo] = useState(null);
  const [images, setImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // ✅ Sửa lỗi thiếu state này
  const [uploadedUrls, setUploadedUrls] = useState({}); // ✅ Sửa lỗi thiếu state này

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
        background: "#222222",
        color: "#fff",
        confirmButtonColor: "#ffcc00",
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
          background: "#222222",
          color: "#fff",
          confirmButtonColor: "#ffcc00",
        });
      }
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Token không hợp lệ!",
        icon: "error",
        background: "#222222",
        color: "#fff",
        confirmButtonColor: "#ffcc00",
      });
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setVideo(file);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 2) {
      Swal.fire({
        title: "Thông báo!",
        text: "Chỉ được chọn tối đa 2 ảnh!",
        icon: "info",
        background: "#222222",
        color: "#fff",
        confirmButtonColor: "#ffcc00",
      });
      return;
    }
    setImages(files);
  };

  const handleUpload = async () => {
    if (!video || images.length !== 2) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng chọn 1 video và 2 ảnh!",
        icon: "error",
        background: "#222222",
        color: "#fff",
        confirmButtonColor: "#ffcc00",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: "Lỗi!",
        text: "Bạn chưa đăng nhập!",
        icon: "error",
        background: "#222222",
        color: "#fff",
        confirmButtonColor: "#ffcc00",
      });
      return;
    }

    const formData = new FormData();
    formData.append("videoFile", video);
    images.forEach((img) => formData.append("imageFiles", img));

    try {
      const response = await axios.post(
        "http://localhost:5116/api/movies/upload",
        formData,
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

      if (response.data.imageUrls && response.data.videoUrl) {
        setImageUrls(response.data.imageUrls);
        setVideoUrl(response.data.videoUrl);
      } else {
        console.error("API không trả về URL hợp lệ");
      }

      setUploadedUrls(response.data);
      Swal.fire("Thành công!", "Upload thành công!", "success");
    } catch (error) {
      console.error("Lỗi upload:", error);
      Swal.fire("Lỗi!", "Upload thất bại!", "error");
    }
  };

  if (!isAdmin)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg font-semibold">
          Bạn không có quyền upload video!
        </p>
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-white w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Upload Film</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chọn Video:
            </label>
            <input
              type="file"
              accept="video/mp4,video/avi,video/mov"
              onChange={handleVideoChange}
              className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chọn Ảnh:
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              className="w-full border border-gray-600 rounded p-2 bg-gray-700 text-white"
            />
          </div>

          <button
            onClick={handleUpload}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition duration-300"
          >
            Upload
          </button>

          {uploadProgress > 0 && (
            <div className="relative w-full bg-gray-700 rounded overflow-hidden">
              <div
                className="bg-blue-500 h-2"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Hiển thị danh sách URL hình ảnh */}
          {imageUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Ảnh đã tải lên:</h3>
              {imageUrls.map((img, index) => (
                <p key={index}>
                  <a
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Ảnh {index + 1}: {img}
                  </a>
                </p>
              ))}
            </div>
          )}

          {/* Hiển thị URL video */}
          {videoUrl && (
            <div>
              <h3 className="text-lg font-semibold">Video đã tải lên:</h3>
              <p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Xem video: {videoUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("addMovie");
  const [movies, setMovies] = useState([]);
  const [tvSeries, setTvSeries] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editMovie, setEditMovie] = useState(null);
  const [editTvSeries, setEditTvSeries] = useState(null);

  const [newMovie, setNewMovie] = useState({
    title: "",
    overview: "",
    genres: "",
    status: "",
    releaseDate: "",
    type: "single_movie",
    studio: "",
    director: "",
    actors: "",
    videoFile: null,
    backdropFile: null,
    posterFile: null,
  });

  const [newTvSeries, setNewTvSeries] = useState({
    title: "",
    overview: "",
    genres: [],
    status: "",
    releaseDate: "",
    studio: "",
    director: "",
    posterImageFile: null,
    backdropImageFile: null,
    actors: "",
  });

  const [newEpisode, setNewEpisode] = useState({
    tvSeriesId: "",
    seasonId: "",
    episodeNumber: "",
    hlsZipFile: null,
  });

  const [updatedMovie, setUpdatedMovie] = useState({
    title: "",
    overview: "",
    genres: "",
    status: "",
    releaseDate: "",
    studio: "",
    director: "",
    posterUrl: "",
    backdropUrl: "",
    videoUrl: "",
    trailerUrl: "",
  });

  const [updatedTvSeries, setUpdatedTvSeries] = useState({
    title: "",
    overview: "",
    genres: "",
    status: "",
    releaseDate: "",
    studio: "",
    director: "",
    posterUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    actors: [],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const adminRole =
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] === "admin";
        setIsAdmin(adminRole);
        if (!adminRole) {
          Swal.fire({
            title: "Cảnh báo!",
            text: "Bạn không có quyền truy cập trang này!",
            icon: "warning",
            background: "#1f2937",
            color: "#fff",
            confirmButtonColor: "#facc15",
          });
          navigate("/");
        } else {
          fetchMovies();
          fetchTvSeries();
        }
      } catch (err) {
        console.error("Error decoding token:", err);
        Swal.fire({
          title: "Lỗi!",
          text: "Token không hợp lệ!",
          icon: "error",
          background: "#1f2937",
          color: "#fff",
          confirmButtonColor: "#facc15",
        });
        navigate("/auth");
      }
    } else {
      Swal.fire({
        title: "Lỗi!",
        text: "Bạn chưa đăng nhập!",
        icon: "error",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
      navigate("/auth");
    }
  }, [navigate]);

  const fetchMovies = async () => {
    try {
      const response = await api.get("http://localhost:5116/api/movies");
      setMovies(response.data || []);
    } catch (err) {
      setError("Failed to fetch movies: " + (err.response?.data?.error || err.message));
    }
  };

  const fetchTvSeries = async () => {
    try {
      const response = await api.get("http://localhost:5116/api/tvseries");
      const seriesData = (response.data || []).map((series) => ({
        ...series,
        title: typeof series.title === "string" ? series.title : "Untitled",
      }));
      setTvSeries(seriesData);
    } catch (err) {
      setError("Failed to fetch TV series: " + (err.response?.data?.error || err.message));
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
      setError("Failed to fetch seasons: " + (error.response?.data?.error || error.message));
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    const { title, status, type, videoFile, backdropFile, posterFile } = newMovie;
    if (!title || !status || !type || !videoFile || !backdropFile || !posterFile) {
      setError("Vui lòng điền đầy đủ thông tin: Title, Status, Type, Video, Backdrop, và Poster!");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const uploadData = new FormData();
    uploadData.append("Title", newMovie.title);
    uploadData.append("Overview", newMovie.overview || "");
    uploadData.append("Genres", newMovie.genres);
    uploadData.append("Status", newMovie.status);
    if (newMovie.releaseDate) {
      const releaseDate = new Date(newMovie.releaseDate);
      uploadData.append("ReleaseDate", releaseDate.toISOString());
    }
    uploadData.append("Type", newMovie.type);
    uploadData.append("Studio", newMovie.studio || "");
    uploadData.append("Director", newMovie.director || "");
    uploadData.append("Actors", newMovie.actors || "");
    uploadData.append("VideoFile", newMovie.videoFile);
    uploadData.append("BackdropFile", newMovie.backdropFile);
    uploadData.append("PosterFile", newMovie.posterFile);

    try {
      const response = await api.post(
        "http://localhost:5116/api/movies/create",
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

      setMovies([...movies, {
        id: response.data.id,
        title: newMovie.title,
        overview: newMovie.overview,
        genres: newMovie.genres,
        status: newMovie.status,
        releaseDate: newMovie.releaseDate,
        studio: newMovie.studio,
        director: newMovie.director,
        posterUrl: response.data.imageUrls[1],
        backdropUrl: response.data.imageUrls[0],
        videoUrl: response.data.videoUrl,
      }]);

      setNewMovie({
        title: "",
        overview: "",
        genres: "",
        status: "",
        releaseDate: "",
        type: "single_movie",
        studio: "",
        director: "",
        actors: "",
        videoFile: null,
        backdropFile: null,
        posterFile: null,
      });
      setUploadProgress(0);
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Thêm phim thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to add movie: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAddTvSeries = async (e) => {
    e.preventDefault();
    const { title, status, posterImageFile, backdropImageFile } = newTvSeries;
    if (!title || !status || !posterImageFile || !backdropImageFile) {
      setError("Vui lòng điền đầy đủ thông tin: Title, Status, Poster Image, và Backdrop Image!");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const uploadData = new FormData();
    uploadData.append("Title", newTvSeries.title);
    uploadData.append("Overview", newTvSeries.overview || "");
    newTvSeries.genres.forEach((genre) => uploadData.append("Genres", genre));
    uploadData.append("Status", newTvSeries.status);
    if (newTvSeries.releaseDate) uploadData.append("ReleaseDate", newTvSeries.releaseDate);
    uploadData.append("Studio", newTvSeries.studio || "");
    uploadData.append("Director", newTvSeries.director || "");
    uploadData.append("PosterImageFile", newTvSeries.posterImageFile);
    uploadData.append("BackdropImageFile", newTvSeries.backdropImageFile);
    uploadData.append("Actors", newTvSeries.actors || "");

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

      setTvSeries([...tvSeries, response.data]);
      setNewTvSeries({
        title: "",
        overview: "",
        genres: [],
        status: "",
        releaseDate: "",
        studio: "",
        director: "",
        posterImageFile: null,
        backdropImageFile: null,
        actors: "",
      });
      setUploadProgress(0);
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Thêm TV series thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to add TV series: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const { tvSeriesId, episodeNumber, hlsZipFile } = newEpisode;
    if (!tvSeriesId || !episodeNumber || !hlsZipFile) {
      setError("Vui lòng điền đầy đủ thông tin: TV Series, Episode Number, và HLS Zip File!");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const uploadData = new FormData();
    uploadData.append("TvSeriesId", newEpisode.tvSeriesId);
    uploadData.append("SeasonId", newEpisode.seasonId || 0);
    uploadData.append("EpisodeNumber", newEpisode.episodeNumber);
    uploadData.append("HlsZipFile", newEpisode.hlsZipFile);

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

      setNewEpisode({
        tvSeriesId: "",
        seasonId: "",
        episodeNumber: "",
        hlsZipFile: null,
      });
      setSeasonsList([]);
      setUploadProgress(0);
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Thêm episode thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to add episode: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteMovie = async (movieId) => {
    try {
      await api.delete(`http://localhost:5116/api/movies/${movieId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setMovies(movies.filter((movie) => movie.id !== movieId));
      Swal.fire({
        title: "Thành công!",
        text: "Xóa phim thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to delete movie: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTvSeries = async (seriesId) => {
    try {
      await api.delete(`http://localhost:5116/api/tvseries/${seriesId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setTvSeries(tvSeries.filter((series) => series.id !== seriesId));
      Swal.fire({
        title: "Thành công!",
        text: "Xóa TV series thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to delete TV series: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEditMovie = (movie) => {
    setEditMovie(movie);
    setUpdatedMovie({
      title: movie.title || "",
      overview: movie.overview || "",
      genres: movie.genres || "",
      status: movie.status || "",
      releaseDate: formatDateForInput(movie.releaseDate),
      studio: movie.studio || "",
      director: movie.director || "",
      posterUrl: movie.posterUrl || "",
      backdropUrl: movie.backdropUrl || "",
      videoUrl: movie.videoUrl || "",
      trailerUrl: movie.trailerUrl || "",
    });
  };

  const handleEditTvSeries = (series) => {
    setEditTvSeries(series);
    setUpdatedTvSeries({
      title: series.title || "",
      overview: series.overview || "",
      genres: series.genres || "",
      status: series.status || "",
      releaseDate: formatDateForInput(series.releaseDate),
      studio: series.studio || "",
      director: series.director || "",
      posterUrl: series.posterUrl || "",
      backdropUrl: series.backdropUrl || "",
      trailerUrl: series.trailerUrl || "",
      actors: series.actors || [],
    });
  };

  const handleUpdateMovie = async (e) => {
    e.preventDefault();
    if (!editMovie) return;

    const formattedData = {
      ...updatedMovie,
      releaseDate: updatedMovie.releaseDate ? new Date(updatedMovie.releaseDate).toISOString() : null,
    };

    try {
      await api.put(
        `http://localhost:5116/api/movies/${editMovie.id}`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setMovies(
        movies.map((movie) =>
          movie.id === editMovie.id ? { ...movie, ...formattedData } : movie
        )
      );
      setEditMovie(null);
      setUpdatedMovie({
        title: "",
        overview: "",
        genres: "",
        status: "",
        releaseDate: "",
        studio: "",
        director: "",
        posterUrl: "",
        backdropUrl: "",
        videoUrl: "",
        trailerUrl: "",
      });
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Cập nhật phim thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to update movie: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateTvSeries = async (e) => {
    e.preventDefault();
    if (!editTvSeries) return;

    const formattedData = {
      ...updatedTvSeries,
      releaseDate: updatedTvSeries.releaseDate ? new Date(updatedTvSeries.releaseDate).toISOString() : null,
      actors: updatedTvSeries.actors.map((actor) => ({
        id: actor.id || 0,
        name: actor.name || actor,
      })),
    };

    try {
      const response = await api.put(
        `http://localhost:5116/api/tvseries/${editTvSeries.id}`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setTvSeries(
        tvSeries.map((series) =>
          series.id === editTvSeries.id ? { ...series, ...response.data } : series
        )
      );
      setEditTvSeries(null);
      setUpdatedTvSeries({
        title: "",
        overview: "",
        genres: "",
        status: "",
        releaseDate: "",
        studio: "",
        director: "",
        posterUrl: "",
        backdropUrl: "",
        trailerUrl: "",
        actors: [],
      });
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Cập nhật TV series thành công!",
        icon: "success",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
      });
    } catch (err) {
      setError("Failed to update TV series: " + (err.response?.data?.error || err.message));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-lg font-semibold">Bạn không có quyền truy cập!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <div className="container mx-auto mt-15">
        <h1 className="text-3xl text-center font-bold mb-6">Admin Dashboard</h1>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-yellow-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("addMovie")}
            className={`pb-2 px-4 ${
              activeTab === "addMovie"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : "text-gray-400"
            }`}
          >
            Add Movie
          </button>
          <button
            onClick={() => setActiveTab("addTvSeries")}
            className={`pb-2 px-4 ${
              activeTab === "addTvSeries"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : "text-gray-400"
            }`}
          >
            Add TV Series
          </button>
          <button
            onClick={() => setActiveTab("addEpisode")}
            className={`pb-2 px-4 ${
              activeTab === "addEpisode"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : "text-gray-400"
            }`}
          >
            Add Episode
          </button>
          <button
            onClick={() => setActiveTab("manageMovies")}
            className={`pb-2 px-4 ${
              activeTab === "manageMovies"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : "text-gray-400"
            }`}
          >
            Manage Movies
          </button>
          <button
            onClick={() => setActiveTab("manageTvSeries")}
            className={`pb-2 px-4 ${
              activeTab === "manageTvSeries"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : "text-gray-400"
            }`}
          >
            Manage TV Series
          </button>
        </div>

        {activeTab === "addMovie" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Add New Movie</h2>
            <form onSubmit={handleAddMovie} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newMovie.title}
                  onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Overview
                </label>
                <textarea
                  value={newMovie.overview}
                  onChange={(e) => setNewMovie({ ...newMovie, overview: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Genres (comma-separated)
                </label>
                <input
                  type="text"
                  value={newMovie.genres}
                  onChange={(e) => setNewMovie({ ...newMovie, genres: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Action, Drama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Actors (comma-separated)
                </label>
                <input
                  type="text"
                  value={newMovie.actors}
                  onChange={(e) => setNewMovie({ ...newMovie, actors: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Tom Hanks, Leonardo DiCaprio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status *
                </label>
                <select
                  value={newMovie.status}
                  onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Released">Released</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={newMovie.releaseDate}
                  onChange={(e) => setNewMovie({ ...newMovie, releaseDate: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Studio
                </label>
                <input
                  type="text"
                  value={newMovie.studio}
                  onChange={(e) => setNewMovie({ ...newMovie, studio: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Director
                </label>
                <input
                  type="text"
                  value={newMovie.director}
                  onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Video File *
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/mov,video/mp2t"
                  onChange={(e) => setNewMovie({ ...newMovie, videoFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Backdrop Image *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setNewMovie({ ...newMovie, backdropFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Poster Image *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setNewMovie({ ...newMovie, posterFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
              >
                Add Movie
              </button>
            </form>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-center text-sm text-gray-300 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "addTvSeries" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Add New TV Series</h2>
            <form onSubmit={handleAddTvSeries} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTvSeries.title}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, title: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Overview
                </label>
                <textarea
                  value={newTvSeries.overview}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, overview: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Genres (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTvSeries.genres.join(", ")}
                  onChange={(e) => {
                    const genres = e.target.value.split(",").map((g) => g.trim()).filter((g) => g);
                    setNewTvSeries({ ...newTvSeries, genres });
                  }}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Action, Drama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Actors (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTvSeries.actors}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, actors: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Actor 1, Actor 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status *
                </label>
                <select
                  value={newTvSeries.status}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, status: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={newTvSeries.releaseDate}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, releaseDate: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Studio
                </label>
                <input
                  type="text"
                  value={newTvSeries.studio}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, studio: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Director
                </label>
                <input
                  type="text"
                  value={newTvSeries.director}
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, director: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Poster Image *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, posterImageFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Backdrop Image *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setNewTvSeries({ ...newTvSeries, backdropImageFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
              >
                Add TV Series
              </button>
            </form>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-center text-sm text-gray-300 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "addEpisode" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Add New Episode</h2>
            <form onSubmit={handleAddEpisode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  TV Series *
                </label>
                <select
                  value={newEpisode.tvSeriesId}
                  onChange={(e) => {
                    setNewEpisode({ ...newEpisode, tvSeriesId: e.target.value });
                    if (e.target.value) fetchSeasons(e.target.value);
                  }}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">Select TV Series</option>
                  {tvSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Season (Optional - Season 1 will be created if none exists)
                </label>
                <select
                  value={newEpisode.seasonId}
                  onChange={(e) => setNewEpisode({ ...newEpisode, seasonId: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  disabled={!newEpisode.tvSeriesId}
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
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Episode Number *
                </label>
                <input
                  type="number"
                  value={newEpisode.episodeNumber}
                  onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  HLS Zip File *
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setNewEpisode({ ...newEpisode, hlsZipFile: e.target.files[0] })}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
              >
                Add Episode
              </button>
            </form>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-center text-sm text-gray-300 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "manageMovies" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Movies</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Release Date</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie) => (
                    <tr key={movie.id} className="border-t border-gray-700">
                      <td className="px-4 py-2">{movie.title}</td>
                      <td className="px-4 py-2">{movie.status}</td>
                      <td className="px-4 py-2">{formatDateForInput(movie.releaseDate)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEditMovie(movie)}
                          className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(movie.id)}
                          className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editMovie && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Edit Movie: {editMovie.title}</h3>
                <form onSubmit={handleUpdateMovie} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.title}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, title: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Overview
                    </label>
                    <textarea
                      value={updatedMovie.overview}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, overview: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Genres
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.genres}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, genres: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Status
                    </label>
                    <select
                      value={updatedMovie.status}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, status: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      required
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Released">Released</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={updatedMovie.releaseDate}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, releaseDate: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Studio
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.studio}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, studio: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.director}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, director: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Poster URL
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.posterUrl}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, posterUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Backdrop URL
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.backdropUrl}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, backdropUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Video URL
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.videoUrl}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, videoUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Trailer URL
                    </label>
                    <input
                      type="text"
                      value={updatedMovie.trailerUrl}
                      onChange={(e) => setUpdatedMovie({ ...updatedMovie, trailerUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400"
                  >
                    Update Movie
                  </button>
                  <button
                    onClick={() => setEditMovie(null)}
                    className="ml-2 px-4 py-2 bg-gray-500 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "manageTvSeries" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage TV Series</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Release Date</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tvSeries.map((series) => (
                    <tr key={series.id} className="border-t border-gray-700">
                      <td className="px-4 py-2">{series.title}</td>
                      <td className="px-4 py-2">{series.status}</td>
                      <td className="px-4 py-2">{formatDateForInput(series.releaseDate)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEditTvSeries(series)}
                          className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTvSeries(series.id)}
                          className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editTvSeries && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Edit TV Series: {editTvSeries.title}</h3>
                <form onSubmit={handleUpdateTvSeries} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.title}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, title: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Overview
                    </label>
                    <textarea
                      value={updatedTvSeries.overview}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, overview: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Genres
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.genres}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, genres: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Actors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.actors.map(actor => actor.name || actor).join(", ")}
                      onChange={(e) => {
                        const actors = e.target.value.split(",").map((a) => a.trim()).filter((a) => a);
                        setUpdatedTvSeries({ ...updatedTvSeries, actors });
                      }}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      placeholder="e.g., Actor 1, Actor 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Status
                    </label>
                    <select
                      value={updatedTvSeries.status}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, status: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                      required
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={updatedTvSeries.releaseDate}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, releaseDate: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Studio
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.studio}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, studio: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.director}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, director: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Poster URL
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.posterUrl}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, posterUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Backdrop URL
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.backdropUrl}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, backdropUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Trailer URL
                    </label>
                    <input
                      type="text"
                      value={updatedTvSeries.trailerUrl}
                      onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, trailerUrl: e.target.value })}
                      className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400"
                  >
                    Update TV Series
                  </button>
                  <button
                    onClick={() => setEditTvSeries(null)}
                    className="ml-2 px-4 py-2 bg-gray-500 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
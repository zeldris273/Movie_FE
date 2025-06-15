import React, { useState, useEffect } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import TabNavigation from "../components/dashboard/TabNavigation";
import ErrorMessage from "../components/ErrorMessage";
import AddMovieForm from "../components/dashboard/AddMovieForm";
import AddTvSeriesForm from "../components/dashboard/AddTvSeriesForm";
import AddEpisodeForm from "../components/dashboard/AddEpisodeForm";
import MovieTable from "../components/dashboard/MovieTable";
import TvSeriesTable from "../components/dashboard/TvSeriesTable";
import UploadProgress from "../components/dashboard/UploadProgress";

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
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] === "Admin";
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
      const response = await api.get("/api/movies");
      setMovies(response.data || []);
    } catch (err) {
      setError(
        "Failed to fetch movies: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const fetchTvSeries = async () => {
    try {
      const response = await api.get("/api/tvseries");
      const seriesData = (response.data || []).map((series) => ({
        ...series,
        title: typeof series.title === "string" ? series.title : "Untitled",
      }));
      setTvSeries(seriesData);
    } catch (err) {
      setError(
        "Failed to fetch TV series: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const fetchSeasons = async (tvSeriesId) => {
    try {
      const response = await api.get(`/api/tvseries/${tvSeriesId}/seasons`);
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
      setError(
        "Failed to fetch seasons: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    const { title, status, type, videoFile, backdropFile, posterFile } =
      newMovie;
    if (
      !title ||
      !status ||
      !type ||
      !videoFile ||
      !backdropFile ||
      !posterFile
    ) {
      setError(
        "Vui lòng điền đầy đủ thông tin: Title, Status, Type, Video, Backdrop, và Poster!"
      );
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
      const response = await api.post("/api/movies/create", uploadData, {
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
      });

      setMovies([
        ...movies,
        {
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
        },
      ]);

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
      setError(
        "Failed to add movie: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleAddTvSeries = async (e) => {
    e.preventDefault();
    const { title, status, posterImageFile, backdropImageFile } = newTvSeries;
    if (!title || !status || !posterImageFile || !backdropImageFile) {
      setError(
        "Vui lòng điền đầy đủ thông tin: Title, Status, Poster Image, và Backdrop Image!"
      );
      return;
    }

    const token = localStorage.getItem("accessToken");
    const uploadData = new FormData();
    uploadData.append("Title", newTvSeries.title);
    uploadData.append("Overview", newTvSeries.overview || "");
    newTvSeries.genres.forEach((genre) => uploadData.append("Genres", genre));
    uploadData.append("Status", newTvSeries.status);
    if (newTvSeries.releaseDate)
      uploadData.append("ReleaseDate", newTvSeries.releaseDate);
    uploadData.append("Studio", newTvSeries.studio || "");
    uploadData.append("Director", newTvSeries.director || "");
    uploadData.append("PosterImageFile", newTvSeries.posterImageFile);
    uploadData.append("BackdropImageFile", newTvSeries.backdropImageFile);
    uploadData.append("Actors", newTvSeries.actors || "");

    try {
      const response = await api.post("/api/tvseries/create", uploadData, {
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
      });

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
      setError(
        "Failed to add TV series: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const { tvSeriesId, episodeNumber, hlsZipFile } = newEpisode;
    if (!tvSeriesId || !episodeNumber || !hlsZipFile) {
      setError(
        "Vui lòng điền đầy đủ thông tin: TV Series, Episode Number, và HLS Zip File!"
      );
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
        "/api/tvseries/episodes/upload",
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
      setError(
        "Failed to add episode: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleDeleteMovie = async (movieId) => {
    try {
      await api.delete(`/api/movies/${movieId}`, {
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
      setError(
        "Failed to delete movie: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleDeleteTvSeries = async (seriesId) => {
    try {
      await api.delete(`/api/tvseries/${seriesId}`, {
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
      setError(
        "Failed to delete TV series: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditMovie = (movie) => {
    setEditMovie(movie);
    setUpdatedMovie({
      id: movie.id,
      title: movie.title || "",
      overview: movie.overview || "",
      genres:
        typeof movie.genres === "string"
          ? movie.genres
          : Array.isArray(movie.genres)
          ? movie.genres.join(", ")
          : "",
      status: movie.status || "",
      releaseDate: formatDateForInput(movie.releaseDate),
      studio: movie.studio || "",
      director: movie.director || "",
      posterUrl: movie.posterUrl || "",
      backdropUrl: movie.backdropUrl || "",
      videoUrl: movie.videoUrl || "",
      trailerUrl: movie.trailerUrl || "",
      actors: movie.actors ? [...movie.actors] : [], // Sao chép danh sách ActorDTO
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
      actors: Array.isArray(series.actors) ? [...series.actors] : [],
    });
  };

 const handleUpdateMovie = async (e) => {
  e.preventDefault();
  if (!editMovie) return;

  const formattedData = {
    ...updatedMovie,
    releaseDate: updatedMovie.releaseDate ? new Date(updatedMovie.releaseDate).toISOString() : null,
    actors: updatedMovie.actors.map((actor) => ({
      Id: actor.id || 0, // Sử dụng id (chữ thường) từ dữ liệu frontend
      Name: actor.name || "", // Chuyển thành Name (viết hoa) để khớp với backend
    })),
  };

  try {
    await api.put(`/api/movies/${editMovie.id}`, formattedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
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
      actors: [], // Đặt lại actors thành mảng rỗng
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
      releaseDate: updatedTvSeries.releaseDate
        ? new Date(updatedTvSeries.releaseDate).toISOString()
        : null,
      actors: updatedTvSeries.actors.map((actor) => ({
        Id: actor.id || 0,
        Name: actor.name || actor,
      })),
    };

    try {
      const response = await api.put(
        `/api/tvseries/${editTvSeries.id}`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setTvSeries(
        tvSeries.map((series) =>
          series.id === editTvSeries.id
            ? { ...series, ...response.data }
            : series
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
      setError(
        "Failed to update TV series: " +
          (err.response?.data?.error || err.message)
      );
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
        <ErrorMessage error={error} onDismiss={() => setError(null)} />
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "addMovie" && (
          <AddMovieForm
            newMovie={newMovie}
            setNewMovie={setNewMovie}
            handleAddMovie={handleAddMovie}
            uploadProgress={uploadProgress}
          />
        )}
        {activeTab === "addTvSeries" && (
          <AddTvSeriesForm
            newTvSeries={newTvSeries}
            setNewTvSeries={setNewTvSeries}
            handleAddTvSeries={handleAddTvSeries}
            uploadProgress={uploadProgress}
          />
        )}
        {activeTab === "addEpisode" && (
          <AddEpisodeForm
            newEpisode={newEpisode}
            setNewEpisode={setNewEpisode}
            handleAddEpisode={handleAddEpisode}
            tvSeries={tvSeries}
            seasonsList={seasonsList}
            fetchSeasons={fetchSeasons}
            uploadProgress={uploadProgress}
          />
        )}
        {activeTab === "manageMovies" && (
          <MovieTable
            movies={movies}
            editMovie={editMovie}
            updatedMovie={updatedMovie}
            setUpdatedMovie={setUpdatedMovie}
            handleEditMovie={handleEditMovie}
            handleUpdateMovie={handleUpdateMovie}
            handleDeleteMovie={handleDeleteMovie}
            formatDateForInput={formatDateForInput}
            setEditMovie={setEditMovie}
          />
        )}
        {activeTab === "manageTvSeries" && (
          <TvSeriesTable
            tvSeries={tvSeries}
            editTvSeries={editTvSeries}
            updatedTvSeries={updatedTvSeries}
            setUpdatedTvSeries={setUpdatedTvSeries}
            handleEditTvSeries={handleEditTvSeries}
            handleUpdateTvSeries={handleUpdateTvSeries}
            handleDeleteTvSeries={handleDeleteTvSeries}
            formatDateForInput={formatDateForInput}
            setEditTvSeries={setEditTvSeries}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

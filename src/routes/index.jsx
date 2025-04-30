import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import ExplorePage from "../pages/ExplorePage";
import DetailsPage from "../pages/DetailsPage";
import SearchPage from "../pages/SearchPage";
import AuthPage from "../pages/AuthPage";
import Watchlist from "../pages/Watchlist";
import CreateMovie from "../pages/CreateMovie";
import CreateTvSeries from "../pages/CreateTvSeries";
import AddEpisode from "../pages/AddEpisode";
import MoviePlayer from "../pages/MoviePlayer";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "movies", // Trang khám phá cho movies
        element: <ExplorePage />,
      },
      {
        path: "tv", // Trang khám phá cho TV series
        element: <ExplorePage />,
      },
      {
        path: "movies/:id/:title", // Xem chi tiết movie
        element: <DetailsPage />,
      },
      {
        path: "tv/:id/:title", // Xem chi tiết TV series
        element: <DetailsPage />,
      },
      {
        path: "movies/:id/watch", // Xem phim movie
        element: <MoviePlayer />,
      },
      {
        path: "tv/:id/:episodeId/watch", // Xem phim TV series (tập cụ thể)
        element: <MoviePlayer />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "watchlist",
        element: <Watchlist />,
      },
      {
        path: "create-movie",
        element: <CreateMovie />,
      },
      {
        path: "create-tv-series",
        element: <CreateTvSeries />,
      },
      {
        path: "add-episode",
        element: <AddEpisode />,
      },
    ],
  },
]);

export default router;

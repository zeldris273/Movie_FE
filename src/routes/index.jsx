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
        path: "movies",
        element: <ExplorePage />,
      },
      {
        path: "tv",
        element: <ExplorePage />,
      },
      {
        path: "movies/:id/:title",
        element: <DetailsPage />,
      },
      {
        path: "tv/:id/:title",
        element: <DetailsPage />,
      },
      {
        path: "movies/:id/:title/watch",
        element: <MoviePlayer />,
      },
      {
        path: "tvseries/:id/:title/episode/:episodeNumber/watch",
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
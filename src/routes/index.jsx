import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import ExplorePage from "../pages/ExplorePage";
import DetailsPage from "../pages/DetailsPage";
import SearchPage from "../pages/SearchPage";
import AuthPage from "../pages/AuthPage";
import Watchlist from "../pages/Watchlist";
import UploadMovie from "../pages/UploadMovie";
import CreateTvSeries from "../pages/CreateTvSeries";
import AddEpisode from "../pages/AddEpisode";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "",
                element: <Home/>
            },
            {
                path: ":explore",
                element: <ExplorePage/>
            },
            {
                path: ":explore/:id",
                element: <DetailsPage/>
            },
            {
                path: "search",
                element: <SearchPage/>
            },
            {
                path: "auth",
                element: <AuthPage/>
            },
            {
                path: "Watch-List",
                element: <Watchlist/>
            },
            {
                path: "upload-movie",
                element: <UploadMovie/>
            },
            {
                path: "create-tv-series",
                element: <CreateTvSeries/>
            },
            {
                path: "add-episode",
                element: <AddEpisode/>
            }
        ]
    }
])

export default router;
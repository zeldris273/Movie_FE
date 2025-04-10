import React, { useState } from "react";
import { useParams } from "react-router-dom";
import useFetchDetails from "../hooks/useFetchDetails";
import moment from "moment";
import Divider from "../components/Divider";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import VideoPlay from "../components/VideoPlay";

const DetailsPage = () => {
  const params = useParams();
  const mediaType = params?.explore; // "movie" hoặc "tvseries"
  const id = params?.id;

  const { data, loading, error } = useFetchDetails(mediaType, id);
  const [playVideo, setPlayVideo] = useState(false);
  const [playVideoId, setPlayVideoId] = useState("");

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-white text-center">No data found.</div>;
  }

  const handlePlayVideo = (data) => {
    setPlayVideoId(data);
    setPlayVideo(true);
  };

  const handlePlayNow = () => {
    console.log("Play Now clicked for", data.title);
    // TODO: Thêm logic để phát phim/series (nếu có API video)
  };

  return (
    <div>
      {/* Backdrop image */}
      <div className="w-full h-[280px] relative hidden lg:block">
        <div className="w-full h-full">
          {data?.backdropUrl ? (
            <img
              src={data.backdropUrl}
              className="h-full w-full object-cover"
              alt="Backdrop"
            />
          ) : (
            <div className="bg-neutral-800 h-full w-full flex justify-center items-center">
              No Backdrop Image
            </div>
          )}
        </div>
        <div className="absolute w-full h-full top-0 bg-gradient-to-t from-neutral-900/90 to-transparent"></div>
      </div>

      <div className="container mx-auto px-3 py-20 lg:py-0 flex flex-col lg:flex-row gap-5 lg:gap-10">
        <div className="relative mx-auto w-fit lg:mx-0 min-w-60 lg:-mt-28">
          {data?.imageUrl ? (
            <img
              src={data.imageUrl}
              className="h-80 w-60 object-cover rounded"
              alt={data.title}
            />
          ) : (
            <div className="bg-neutral-800 h-80 w-60 flex justify-center items-center rounded">
              No Image Found
            </div>
          )}
          <button
            onClick={() => handlePlayVideo(data)}
            className="mt-5 w-full py-2 px-4 text-center bg-white text-black rounded font-bold text-lg hover:bg-gradient-to-l from-red-500 to-orange-500 hover:scale-105 transition-all"
          >
            Watch Trailer
          </button>
          <button
            onClick={handlePlayNow}
            className="mt-5 w-full py-2 px-4 text-center bg-white text-black rounded font-bold text-lg hover:bg-gradient-to-l from-red-500 to-orange-500 hover:scale-105 transition-all"
          >
            Play Now
          </button>
          <button
            className="flex flex-col items-center justify-center gap-1 w-full cursor-pointer
                    px-3 py-2 border border-black rounded-lg 
                    text-white bg-black/30 hover:bg-transparent transition mt-5"
          >
            <span className="text-sm font-medium">+ Add to Watch List</span>
          </button>
        </div>

        <div>
          <h2 className="text-2xl lg:text-4xl font-bold text-white">
            {data?.title}
          </h2>

          <Divider />
          <div className="flex items-center my-3 gap-3">
            {data?.rating != null && (
              <>
                <p>Rating: </p>
                <div className="w-8 h-8">
                  <CircularProgressbar
                    value={data.rating * 10}
                    text={`${(data.rating * 10).toFixed(0)}%`}
                    styles={buildStyles({
                      textColor: "#fff",
                      textSize: "25px",
                      pathColor:
                        data.rating >= 7
                          ? "green"
                          : data.rating >= 5
                          ? "orange"
                          : "red",
                      trailColor: "#ddd",
                    })}
                  />
                </div>
              </>
            )}
          </div>

          <Divider />

          <div>
            <h3 className="text-xl font-bold text-white mb-1">Overview</h3>
            <p>{data?.overview || "No overview available."}</p>

            <Divider />

            <div className="flex gap-2">
              {data?.genres?.split(", ").map((genre, index) => (
                <span
                  key={"Genre" + index}
                  className="bg-gray-700/60 text-white text-xs font-bold px-2 py-1 rounded-md"
                >
                  {genre}
                </span>
              ))}
            </div>

            <Divider />
            <div className="flex items-center gap-3 my-3 text-center">
              <p>Status: {data?.status}</p>
              <span>|</span>
              <p>
                Release Date:{" "}
                {data?.releaseDate
                  ? moment(data.releaseDate).format("YYYY")
                  : "N/A"}
              </p>
            </div>
            <Divider />
            {mediaType === "tvseries" && (
              <>
                <p>Episode Number: {data?.numberOfEpisodes}</p>
                <Divider />
              </>
            )}

            <div>
              <p>
                <span className="text-white">Director: </span>
                {data?.director || "N/A"}
              </p>
              <Divider />
              <p>
                <span className="text-white">Studio: </span>
                {data?.studio || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal phát trailer */}
      {playVideo && (
        <VideoPlay
          data={playVideoId}
          close={() => setPlayVideo(false)}
          media_type={params?.explore}
        />
      )}
    </div>
  );
};

export default DetailsPage;
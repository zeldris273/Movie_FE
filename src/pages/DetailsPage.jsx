import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useFetchDetails from '../hooks/useFetchDetails';
import moment from 'moment';
import Divider from '../components/Divider';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import VideoPlay from '../components/VideoPlay';
import axios from 'axios';
import Swal from 'sweetalert2';

const DetailsPage = () => {
  const { id, title } = useParams(); // Lấy id và title từ URL
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định mediaType từ URL
  const mediaType = location.pathname.includes('movies') ? 'movie' : 'tv';

  const { data, loading, error } = useFetchDetails(mediaType, id);
  const [playVideo, setPlayVideo] = useState(false);
  const [playVideoId, setPlayVideoId] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [episodeError, setEpisodeError] = useState(null);
  const [isInWatchList, setIsInWatchList] = useState(false);

  // Kiểm tra xem media đã có trong watchlist chưa
  useEffect(() => {
    const checkWatchList = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5116/api/watchlist', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const watchList = response.data;
        const exists = watchList.some(
          (item) => item.mediaId === parseInt(id) && item.mediaType === mediaType
        );
        setIsInWatchList(exists);
      } catch (err) {
        console.error('Error checking watchlist:', err);
      }
    };

    checkWatchList();
  }, [id, mediaType]);

  // Lấy danh sách episodes nếu là TvSeries
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (mediaType !== 'tv' || !id) {
        console.log('Not fetching episodes: mediaType is not tv or id is missing', { mediaType, id });
        return;
      }

      try {
        console.log('Fetching seasons for TV series ID:', id);
        const seasonsResponse = await axios.get(
          `http://localhost:5116/api/tvseries/${id}/seasons`
        );
        const seasons = seasonsResponse.data;
        console.log('Seasons response:', seasons);

        if (seasons.length > 0) {
          console.log('Fetching episodes for season ID:', seasons[0].id);
          const episodesResponse = await axios.get(
            `http://localhost:5116/api/tvseries/seasons/${seasons[0].id}/episodes`
          );
          console.log('Episodes response:', episodesResponse.data);
          setEpisodes(episodesResponse.data);

          if (episodesResponse.data.length === 0) {
            setEpisodeError('No episodes found for this season.');
            console.log('No episodes found for season ID:', seasons[0].id);
          }
        } else {
          setEpisodeError('No seasons found for this series.');
          console.log('No seasons found for TV series ID:', id);
        }
      } catch (err) {
        console.error('Error fetching episodes:', err);
        if (err.response) {
          console.log('Error response status:', err.response.status);
          console.log('Error response data:', err.response.data);
          setEpisodeError(
            err.response.status === 404
              ? 'Season not found or no episodes available.'
              : 'Failed to fetch episodes.'
          );
        } else {
          console.log('Error message:', err.message);
          setEpisodeError('Failed to fetch episodes due to network or server error.');
        }
      }
    };

    fetchEpisodes();
  }, [mediaType, id]);

  // Xử lý khi nhấn nút "Add to Watch List"
  const handleAddToWatchList = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        title: '',
        text: 'Please log in to add to watch list.',
        icon: 'error',
        background: '#222222',
        color: '#fff',
        confirmButtonColor: '#ffcc00',
      });
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5116/api/watchlist/add',
        {
          MediaId: parseInt(id),
          MediaType: mediaType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setIsInWatchList(true);
        Swal.fire({
          title: '',
          text: 'Added to Watch List',
          icon: 'success',
          background: '#222222',
          color: '#fff',
          confirmButtonColor: '#ffcc00',
        });
      }
    } catch (error) {
      console.error('Error adding to watch list:', error);
      if (error.response) {
        Swal.fire({
          title: '',
          text: error.response.data.error || 'Failed to add to watch list.',
          icon: 'error',
          background: '#222222',
          color: '#fff',
          confirmButtonColor: '#ffcc00',
        });
      } else {
        Swal.fire({
          title: '',
          text: 'Failed to add to watch list due to network error.',
          icon: 'error',
          background: '#222222',
          color: '#fff',
          confirmButtonColor: '#ffcc00',
        });
      }
    }
  };

  const handlePlayVideo = (data) => {
    console.log('Playing trailer for data:', data);
    setPlayVideoId(data);
    setPlayVideo(true);
  };

  const handlePlayNow = () => {
    if (mediaType === 'movie') {
      console.log('Navigating to movie player for movie ID:', data.id);
      navigate(`/movies/${data.id}/watch`); // Điều hướng đúng: /movies/:id/watch
    } else if (mediaType === 'tv') {
      const firstEpisode = episodes[0];
      if (firstEpisode) {
        console.log('Navigating to TV series player for series ID:', data.id, 'and episode ID:', firstEpisode.id);
        navigate(`/tv/${data.id}/${firstEpisode.id}/watch`); // Điều hướng đúng: /tv/:id/:episodeId/watch
      } else {
        console.error('No episodes found for this series.');
        Swal.fire({
          title: '',
          text: episodeError || 'No episodes available to play.',
          icon: 'error',
          background: '#222222',
          color: '#fff',
          confirmButtonColor: '#ffcc00',
        });
      }
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  if (error) {
    console.log('Error from useFetchDetails:', error);
    return <div className="text-white text-center">Error: {error}</div>;
  }

  if (!data) {
    console.log('No data returned from useFetchDetails');
    return <div className="text-white text-center">No data found.</div>;
  }

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
          {data?.posterUrl ? (
            <img
              src={data.posterUrl}
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
            onClick={handleAddToWatchList}
            className={`flex flex-col items-center justify-center gap-1 w-full cursor-pointer px-3 py-2 border border-black rounded-lg text-white transition mt-5 ${
              isInWatchList ? 'bg-green-600' : 'bg-black/30 hover:bg-transparent'
            }`}
            disabled={isInWatchList}
          >
            <span className="text-sm font-medium">
              {isInWatchList ? 'Added to Watch List' : '+ Add to Watch List'}
            </span>
          </button>
        </div>

        <div>
          <h2 className="text-2xl lg:text-4xl font-bold text-white">
            {data?.title}
          </h2>

          <Divider />
          <div className="flex items-center my-3 gap-3">
            {data?.rating > 0 && (
              <>
                <p>Rating: </p>
                <div className="w-8 h-8">
                  <CircularProgressbar
                    value={data.rating * 10}
                    text={`${(data.rating * 10).toFixed(0)}%`}
                    styles={buildStyles({
                      textColor: '#fff',
                      textSize: '25px',
                      pathColor:
                        data.rating >= 7
                          ? 'green'
                          : data.rating >= 5
                          ? 'orange'
                          : 'red',
                      trailColor: '#ddd',
                    })}
                  />
                </div>
              </>
            )}
          </div>

          <Divider />

          <div>
            <h3 className="text-xl font-bold text-white mb-1">Overview</h3>
            <p>{data?.overview || 'No overview available.'}</p>

            <Divider />

            <div className="flex gap-2">
              {data?.genres && typeof data.genres === 'string' ? (
                data.genres
                  .replace(/\s*,\s*/g, ',')
                  .split(',')
                  .map((genre, index) => (
                    <span
                      key={'Genre' + index}
                      className="bg-gray-700/60 text-white text-xs font-bold px-2 py-1 rounded-md"
                    >
                      {genre.trim()}
                    </span>
                  ))
              ) : (
                <span className="text-gray-400">No genres available</span>
              )}
            </div>

            <Divider />
            <div className="flex items-center gap-3 my-3 text-center">
              <p>Status: {data?.status}</p>
              <span>|</span>
              <p>
                Release Date:{' '}
                {data?.releaseDate
                  ? moment(data.releaseDate).format('YYYY')
                  : 'N/A'}
              </p>
            </div>
            <Divider />
            {mediaType === 'tv' && (
              <>
                <p>Episode Number: {data?.numberOfEpisodes}</p>
                <Divider />
              </>
            )}

            <div>
              <p>
                <span className="text-white">Director: </span>
                {data?.director || 'N/A'}
              </p>
              <Divider />
              <p>
                <span className="text-white">Studio: </span>
                {data?.studio || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {playVideo && (
        <VideoPlay
          data={playVideoId}
          close={() => setPlayVideo(false)}
          media_type={mediaType} // Sửa params.explore thành mediaType
        />
      )}
    </div>
  );
};

export default DetailsPage;
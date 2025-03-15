import React from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { FaStar } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const Card = ({ data, trending, index, media_type }) => {

    const imageURL = useSelector(state => state.movieData.imageURL)

    const mediaType = data.media_type ?? media_type

    return (
        <Link to={"/"+mediaType+"/"+data.id} className='w-full min-w-[250px] max-w-[250px] h-80 overflow-hidden block rounded relative hover:scale-105 transition-all'>
            {
                data?.poster_path ? (
                    <img
                    src={imageURL + data?.poster_path}
                />
                ) : (
                    <div className='bg-neutral-800 h-full w-full flex justify-center items-center'>
                        No Image Found
                    </div>
                )
            }

         

            <div className='absolute top-4'>
                {
                    trending && (
                        <div className='py-1 px-4 backdrop-blur-3xl rounded-r-full bg-black/50'>
                            #{index} Trending
                        </div>
                    )
                }
            </div>
            <div className='absolute bottom-0 h-14 backdrop-blur-3xl w-full bg-black/60 p-2'>
                <h2 className='text-ellipsis line-clamp-1 text-lg font-semibold'>{data?.title || data?.name}</h2>
                <div className='text-sm text-neutral-400 flex justify-between'>
                    <p>{moment(data.release_date).format("MMMM Do YYYY")}</p>
                    <div className='flex gap-1 bg-black px-1 rounded-full text-xs items-center text-white'>
                        <FaStar style={{ transform: 'translateY(-1px)' }} />
                        <p>{Number(data.vote_average).toFixed(1)}</p>
                    </div>

                </div>
            </div>
        </Link>
    )
}

export default Card

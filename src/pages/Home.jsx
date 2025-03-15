import React, { useEffect, useState } from 'react'
import BannerHome from '../components/BannerHome'
import Card from '../components/Card'
import { useSelector } from 'react-redux'
import HorizontalScrollCard from '../components/HorizontalScrollCard'
import axios from 'axios'
import useFetch from '../hooks/useFetch'

const Home = () => {

  const trendingData = useSelector(state => state.movieData.bannerData)
  const { data: nowPlayingData } = useFetch("/movie/now_playing")
  const { data: topRateData } = useFetch("/movie/top_rated")
  const { data: popularTvShowData } = useFetch("/tv/popular")
  const { data: onTheAirShowData } = useFetch("/tv/on_the_air")

  return (
    <div>
      <BannerHome />
      <HorizontalScrollCard data={trendingData} heading={"Trending"} trending={true} />
      <HorizontalScrollCard data={nowPlayingData} heading={"Now Playing"} media_type={"movie"} />
      <HorizontalScrollCard data={topRateData} heading={"Top Rated Movies"} media_type={"movie"}/>
      <HorizontalScrollCard data={popularTvShowData} heading={"Popular TV Show"} media_type={"tv"}/>
      <HorizontalScrollCard data={onTheAirShowData} heading={"On The Air"} media_type={"tv"}/>
    </div>
  )
}

export default Home

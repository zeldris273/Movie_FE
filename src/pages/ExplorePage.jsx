import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/Card'

const ExplorePage = () => {
  const params = useParams()
  const [pageNo, setPageNo] = useState(1)
  const [data, setData] = useState([])
  const [totalPageNo, setTotalPageNo] = useState(0)

  const fetchData = async () => {
    try {
      const respone = await axios.get(`/discover/${params.explore}`, {
        params: {
          page: pageNo
        }
      })
      setData((prev) => {
        return [
          ...prev,
          ...respone.data.results
        ]
      })
      setTotalPageNo(respone.data.total_pages)
    } catch (error) {
      console.log('error: ', error)
    }
  }

  const handleScroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && pageNo < totalPageNo) {
        setPageNo(prev => prev + 1)
    }
}

useEffect(() => {
  if (pageNo <= totalPageNo) {
      fetchData()
  }
}, [pageNo])


useEffect(() => {
  setPageNo(1)
  setData([])
}, [params.explore])

useEffect(() => {
  fetchData()
}, [pageNo, params.explore])


  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className='py-16'>
      <div className='container mx-auto'>
        <h3 className='capitalize text-lg lg:text-xl font-semibold my-3'>Popular {params.explore} Show</h3>

        <div className='grid grid-cols-[repeat(auto-fit,260px)] gap-6 justify-center lg:justify-start'>
          {
            data.map((exploreData, index) => {
              return (
                <Card data={exploreData} key={data.id + "exploreSection"} media_type={params.explore} />
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

export default ExplorePage

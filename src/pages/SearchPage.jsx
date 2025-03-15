import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/Card'

const SearchPage = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [data, setData] = useState([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const query = location?.search?.slice(3)

    const fetchData = async () => {
        if (!query) return

        setLoading(true)
        try {
            const response = await axios.get("/search/multi", {
                params: {
                    query,
                    page
                }
            })
            setData((prev) => [
                ...prev,
                ...response.data.results
            ])
        } catch (error) {
            console.error('Error fetching search results: ', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
        setData([])
        fetchData()
    }, [location?.search])

    useEffect(() => {
        fetchData()
    }, [page])

    useEffect(() => {
        const handleScroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                setPage((prev) => prev + 1)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSearch = (e) => {
        const value = e.target.value
        navigate(`/search?q=${value}`)
    }

    return (
        <div className='pt-16'>
            <div className='lg:hidden my-2 mx-1 sticky top-[70px] z-30'>
                <input 
                    type='text'
                    placeholder='Search here...'
                    onChange={handleSearch}
                    value={query?.split("%20").join(" ")}
                    className='px-4 py-1 text-lg w-full bg-white rounded-full'
                />
            </div>
            <div className='container mx-auto'>
                <h3 className='capitalize text-lg lg:text-xl font-semibold my-3'>Search Results</h3>
                <div className='grid grid-cols-[repeat(auto-fit,260px)] gap-6 justify-center lg:justify-start text-neutral-900'>
                    {
                        data.map((searchData) => (
                            <Card data={searchData} key={searchData.id + "search"} media_type={searchData.media_type} />
                        ))
                    }
                </div>
                {loading && <p className="text-center mt-4">Loading more results...</p>}
            </div>
        </div>
    )
}

export default SearchPage

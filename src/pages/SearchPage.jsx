import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/MyCard";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const query = location?.search?.slice(3)?.split("%20")?.join(" ") || "";

  const fetchData = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5116/api/search/all", {
        params: {
          title: query,
          page,
        },
      });
      setData((prev) => [...prev, ...response.data.results]);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error("Error fetching search results: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setData([]);
    fetchData();
  }, [location?.search]);

  useEffect(() => {
    if (page > 1) {
      fetchData();
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight &&
        page < totalPages &&
        !loading
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, totalPages, loading]);

  const handleSearch = (e) => {
    const value = e.target.value;
    navigate(`/search?q=${value}`);
  };

  return (
    <div className="pt-16">
      <div className="lg:hidden my-2 mx-1 sticky top-[70px] z-30">
        <input
          type="text"
          placeholder="Search here..."
          onChange={handleSearch}
          value={query}
          className="px-4 py-1 text-lg w-full bg-white rounded-full"
        />
      </div>
      <div className="container mx-auto">
        <h3 className="capitalize text-lg lg:text-xl font-semibold my-3">
          {query ? `Search Results for "${query}"` : "Search Results"}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,260px)] gap-6 justify-center lg:justify-start text-neutral-900">
          {data.map((searchData) => (
            <Card
              data={searchData}
              key={searchData.id}
              media_type={searchData.type.toLowerCase()}
            />
          ))}
        </div>
        {loading && <p className="text-center mt-4">Loading more results...</p>}
      </div>
    </div>
  );
};

export default SearchPage;
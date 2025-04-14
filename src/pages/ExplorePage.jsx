import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/MyCard";

const ExplorePage = () => {
  const params = useParams();
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const endpoint = params.explore === "tv" ? "tvseries" : "movies";
      const response = await axios.get(`http://localhost:5116/api/${endpoint}`);
      setData(response.data);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.explore]);

  return (
    <div className="py-16">
      <div className="container mx-auto">
        <h3 className="capitalize text-lg lg:text-xl font-semibold my-3">
          Popular {params.explore} Show
        </h3>

        <div className="grid grid-cols-[repeat(auto-fit,260px)] gap-6 justify-center lg:justify-start">
          {data.map((exploreData, index) => (
            <Card
              data={exploreData}
              key={exploreData.id + "exploreSection"}
              media_type={params.explore}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
// Import Mapbox as an ESM module
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGVhcmVuYXMiLCJhIjoiY213YTk2ZW1jMDM0ODJ5cTBtY3pwanpwZyJ9.Yt_ZReNWCR6PKntG7bdoaw";

// Initialize the map
const map = new mapboxgl.Map({
  container: "map", // ID of the div where the map will render
  style: "mapbox://styles/mapbox/streets-v12", // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18, // Maximum allowed zoom
});
map.on("load", async () => {
  map.addSource("boston_route", {
    type: "geojson",
    data: "https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson",
  });

  map.addLayer({
    id: "bike-lanes",
    type: "line",
    source: "boston_route",
    paint: {
      "line-color": "#bba2e4",
      "line-width": 5,
      "line-opacity": 0.6,
    },
  });
  // Cambridge source
  map.addSource("cambridge_route", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson",
  });

  // Cambridge bike lanes
  map.addLayer({
    id: "cambridge-bike-lanes",
    type: "line",
    source: "cambridge_route",
    paint: {
      "line-color": "#bba2e4",
      "line-width": 5,
      "line-opacity": 0.6,
    },
  });
  let jsonData;

  try {
    const jsonurl =
      "https://dsc-courses.github.io/dsc209r-2025-fa/labs/lab07/data/bluebikes-stations.json";

    // Await JSON fetch
    jsonData = await d3.json(jsonurl);

    console.log("Loaded JSON Data:", jsonData);
  } catch (error) {
    console.error("Error loading JSON:", error);
  }

  let stations = jsonData.data.stations;

  //console.log('Stations Array:', stations);
  // Load Bluebikes traffic data
  const trips = await d3.csv(
    "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv",
  );

  const departures = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.start_station_id,
  );

  const arrivals = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.end_station_id,
  );
  stations = stations.map((station) => {
    let id = station.short_name;

    station.arrivals = arrivals.get(id) ?? 0;

    station.departures = departures.get(id) ?? 0;

    station.totalTraffic = station.arrivals + station.departures;

    return station;
  });

    const radiusScale = d3
        .scaleSqrt()
        .domain([0, d3.max(stations, (d) => d.totalTraffic)])
        .range([0, 25]);





  // Append circles to the SVG for each station
  const circles = svg
    .selectAll("circle")
    .data(stations)
    .enter()
    .append("circle")
    .attr('r', (d) => radiusScale(d.totalTraffic))
    .attr("fill", "steelblue") // Circle fill color
    .attr("stroke", "white") // Circle border color
    .attr("stroke-width", 1) // Circle border thickness
    .attr("opacity", 0.8); // Circle opacity

  function updatePositions() {
    circles
      .attr("cx", (d) => getCoords(d).cx)
      .attr("cy", (d) => getCoords(d).cy);
  }

  // Initial position update when map loads
  updatePositions();
  map.on("move", updatePositions);
  map.on("zoom", updatePositions);
  map.on("resize", updatePositions);
  map.on("moveend", updatePositions);
});
const svg = d3.select("#map").select("svg");

function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat); // Convert lon/lat to Mapbox LngLat
  const { x, y } = map.project(point); // Project to pixel coordinates
  return { cx: x, cy: y }; // Return as object for use in SVG attributes
}

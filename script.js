const width = 900;
const height = 900;

const svg = d3
  .select("#map")
  .attr("viewBox", `0 0 ${width} ${height}`);

const info = document.getElementById("info");
const defaultInfoText = "คลิกจังหวัดเพื่อดูข้อมูล";
let selectedName = null;

fetch("thailand.json")

  .then(res => res.json())

  .then(data => {

    const projection = d3.geoMercator()

      .fitSize([width, height], data);

    const path = d3.geoPath(projection);

    svg.selectAll("path")

      .data(data.features)

      .enter()

      .append("path")

      .attr("class", "province")

      .attr("d", path)

      // Live name readout while hovering
      .on("mouseenter", function (event, d) {
        info.innerHTML = d.properties.name;
      })

      .on("mouseleave", function () {
        info.innerHTML = selectedName || defaultInfoText;
      })

      // Click -> lock in selection, then jump to the province dashboard
      .on("click", function (event, d) {

        d3.selectAll(".province")
          .classed("selected", false);

        d3.select(this)
          .classed("selected", true);

        selectedName = d.properties.name;
        info.innerHTML = selectedName;

        const [lon, lat] = d3.geoCentroid(d);

        const params = new URLSearchParams({
          name: d.properties.name,
          lat: lat.toFixed(4),
          lon: lon.toFixed(4)
        });

        window.location.href = `dashboard.html?${params.toString()}`;
      });

  });

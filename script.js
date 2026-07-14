const width = 900;
const height = 900;

const svg = d3
  .select("#map")
  .attr("viewBox", `0 0 ${width} ${height}`);

// สำหรับ Zoom
const g = svg.append("g");

const info = document.getElementById("info");
const defaultInfoText = "คลิกจังหวัดเพื่อดูข้อมูลสภาพอากาศ";

let selectedName = null;

fetch("thailand.json")
  .then((res) => res.json())
  .then((data) => {

    const projection = d3
      .geoMercator()
      .fitSize([width, height], data);

    const path = d3.geoPath(projection);

    g.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path)

      // ===================
      // Hover
      // ===================
      .on("mouseenter", function (event, d) {
        info.innerHTML = d.properties.name;
      })

      .on("mouseleave", function () {
        info.innerHTML = selectedName || defaultInfoText;
      })

      // ===================
      // Click
      // ===================
      .on("click", function (event, d) {

        // ล้างจังหวัดที่เลือกก่อนหน้า
        d3.selectAll(".province")
          .classed("selected", false)
          .classed("fade", true);

        // จังหวัดที่กด
        d3.select(this)
          .classed("selected", true)
          .classed("fade", false);

        // แสดงชื่อจังหวัด
        selectedName = d.properties.name;
        info.innerHTML = selectedName;

        // ===================
        // Zoom เข้าไป
        // ===================

        const bounds = path.bounds(d);

        const x =
          (bounds[0][0] + bounds[1][0]) / 2;

        const y =
          (bounds[0][1] + bounds[1][1]) / 2;


        // ปรับความใกล้ได้
        const scale = 4;

        g.transition()
          .duration(800)
          .attr(
            "transform",
            `
            translate(${width / 2},${height / 2})
            scale(${scale})
            translate(${-x},${-y})
            `
          );


        // ===================
        // เตรียมข้อมูลส่งไปหน้า Dashboard
        // ===================

        const [lon, lat] = d3.geoCentroid(d);

        const params = new URLSearchParams({
          name: d.properties.name,
          lat: lat.toFixed(4),
          lon: lon.toFixed(4),
        });


        // ===================
        // รอ Zoom เสร็จแล้วค่อยเปลี่ยนหน้า
        // ===================

        setTimeout(() => {

          window.location.href =
            `dashboard.html?${params.toString()}`;

        }, 900);

      });

  });
// WMO weather codes -> Thai description + icon
// https://open-meteo.com/en/docs (weather_code)
const WEATHER_CODES = {
    0: { desc: "ท้องฟ้าแจ่มใส", icon: "☀️" },
    1: { desc: "แจ่มใสเป็นส่วนใหญ่", icon: "🌤️" },
    2: { desc: "มีเมฆบางส่วน", icon: "⛅" },
    3: { desc: "มีเมฆมาก", icon: "☁️" },
    45: { desc: "หมอก", icon: "🌫️" },
    48: { desc: "หมอกน้ำแข็งเกาะ", icon: "🌫️" },
    51: { desc: "ฝนละอองเบา", icon: "🌦️" },
    53: { desc: "ฝนละอองปานกลาง", icon: "🌦️" },
    55: { desc: "ฝนละอองหนาแน่น", icon: "🌧️" },
    56: { desc: "ฝนละอองเยือกแข็งเบา", icon: "🌧️" },
    57: { desc: "ฝนละอองเยือกแข็งหนาแน่น", icon: "🌧️" },
    61: { desc: "ฝนตกเล็กน้อย", icon: "🌧️" },
    63: { desc: "ฝนตกปานกลาง", icon: "🌧️" },
    65: { desc: "ฝนตกหนัก", icon: "🌧️" },
    66: { desc: "ฝนเยือกแข็งเล็กน้อย", icon: "🌧️" },
    67: { desc: "ฝนเยือกแข็งหนัก", icon: "🌧️" },
    71: { desc: "หิมะตกเล็กน้อย", icon: "🌨️" },
    73: { desc: "หิมะตกปานกลาง", icon: "🌨️" },
    75: { desc: "หิมะตกหนัก", icon: "❄️" },
    77: { desc: "เกล็ดหิมะ", icon: "❄️" },
    80: { desc: "ฝนซู่เล็กน้อย", icon: "🌦️" },
    81: { desc: "ฝนซู่ปานกลาง", icon: "🌧️" },
    82: { desc: "ฝนซู่รุนแรง", icon: "⛈️" },
    85: { desc: "หิมะซู่เล็กน้อย", icon: "🌨️" },
    86: { desc: "หิมะซู่หนัก", icon: "❄️" },
    95: { desc: "พายุฝนฟ้าคะนอง", icon: "⛈️" },
    96: { desc: "พายุฝนฟ้าคะนอง มีลูกเห็บเล็กน้อย", icon: "⛈️" },
    99: { desc: "พายุฝนฟ้าคะนอง มีลูกเห็บหนัก", icon: "⛈️" }
};

const WIND_DIRS = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];

// US EPA PM2.5 breakpoints -> category label + badge color
const PM25_LEVELS = [
    { max: 12.0,  label: "คุณภาพดี",              color: "#3ddc84" },
    { max: 35.4,  label: "ปานกลาง",                color: "#e8d34a" },
    { max: 55.4,  label: "ไม่ดีต่อกลุ่มเสี่ยง",     color: "#ff8c3c" },
    { max: 150.4, label: "ไม่ดีต่อสุขภาพ",          color: "#ff5b5b" },
    { max: 250.4, label: "ไม่ดีต่อสุขภาพมาก",       color: "#b23bff" },
    { max: Infinity, label: "อันตราย",              color: "#8b1a1a" }
];

function pm25Level(value) {
    return PM25_LEVELS.find(l => value <= l.max) || PM25_LEVELS[PM25_LEVELS.length - 1];
}

function windDirLabel(deg) {
    const idx = Math.round(deg / 45) % 8;
    return WIND_DIRS[idx];
}

function el(id) {
    return document.getElementById(id);
}

// Simple deterministic hash so mock PM2.5 data is stable per-province
// rather than jumping around on every page load.
function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
}

function mockAirQuality(name) {
    const seed = hashSeed(name);
    const pm25 = 8 + (seed % 70);              // roughly 8-78 µg/m³
    const pm10 = pm25 * 1.6;
    const usAqi = Math.round(pm25 * 2.1);
    const euAqi = Math.round(pm25 * 1.3);
    const ozone = 20 + (seed % 40);
    const no2 = 5 + (seed % 25);
    const co = 150 + (seed % 300);

    return {
        pm2_5: pm25,
        pm10: pm10,
        us_aqi: usAqi,
        european_aqi: euAqi,
        ozone: ozone,
        nitrogen_dioxide: no2,
        carbon_monoxide: co,
        time: new Date().toISOString(),
        mock: true
    };
}

const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "ไม่ทราบจังหวัด";
const lat = parseFloat(params.get("lat"));
const lon = parseFloat(params.get("lon"));

el("provinceName").textContent = name;

const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);

if (hasCoords) {
    el("provinceCoords").textContent = `lat ${lat.toFixed(4)}, lon ${lon.toFixed(4)}`;
} else {
    el("provinceCoords").textContent = "ไม่พบพิกัด";
}

// ---------- Weather (fetched immediately) ----------

if (!hasCoords) {

    el("weatherLoading").hidden = true;
    const box = el("weatherError");
    box.hidden = false;
    box.textContent = "ไม่พบพิกัดของจังหวัดนี้ กรุณากลับไปเลือกจังหวัดใหม่จากแผนที่";

} else {

    const weatherUrl = "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,pressure_msl" +
        "&daily=temperature_2m_max,temperature_2m_min" +
        "&timezone=auto";

    fetch(weatherUrl)
        .then(res => {
            if (!res.ok) throw new Error("weather request failed");
            return res.json();
        })
        .then(data => {

            const c = data.current;
            const weather = WEATHER_CODES[c.weather_code] || { desc: "ไม่ทราบสภาพอากาศ", icon: "❔" };

            el("temperature").textContent = Math.round(c.temperature_2m);
            el("feelsLike").textContent = Math.round(c.apparent_temperature);
            el("weatherIcon").textContent = weather.icon;
            el("weatherDesc").textContent = weather.desc;

            el("humidity").textContent = Math.round(c.relative_humidity_2m);
            el("windSpeed").textContent = Math.round(c.wind_speed_10m);
            el("windDir").textContent = `จากทิศ${windDirLabel(c.wind_direction_10m)}`;
            el("precip").textContent = c.precipitation.toFixed(1);
            el("cloud").textContent = Math.round(c.cloud_cover);
            el("pressure").textContent = Math.round(c.pressure_msl);

            if (data.daily) {
                el("tempMax").textContent = Math.round(data.daily.temperature_2m_max[0]);
                el("tempMin").textContent = Math.round(data.daily.temperature_2m_min[0]);
            }

            const updated = new Date(c.time);
            el("updatedAt").textContent = updated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

            el("weatherLoading").hidden = true;
            el("weatherReadout").hidden = false;
        })
        .catch(err => {
            el("weatherLoading").hidden = true;
            const box = el("weatherError");
            box.hidden = false;
            box.textContent = "ไม่สามารถดึงข้อมูลสภาพอากาศได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
            console.error(err);
        });
}

// ---------- Air quality (fetched lazily, first time the tab opens) ----------

let airLoaded = false;

function renderAirQuality(data) {

    const level = pm25Level(data.pm2_5);

    el("pm25").textContent = Math.round(data.pm2_5);
    el("aqiBadge").textContent = level.label;
    el("aqiBadge").style.background = level.color;
    el("aqiDesc").textContent = data.mock ? "ข้อมูลจำลองสำหรับสาธิต" : "ตามมาตรฐาน US EPA";

    el("pm10").textContent = Math.round(data.pm10);
    el("usAqi").textContent = Math.round(data.us_aqi);
    el("euAqi").textContent = Math.round(data.european_aqi);
    el("ozone").textContent = Math.round(data.ozone);
    el("no2").textContent = Math.round(data.nitrogen_dioxide);
    el("co").textContent = Math.round(data.carbon_monoxide);

    const updated = new Date(data.time);
    el("airUpdatedAt").textContent = Number.isNaN(updated.getTime())
        ? "—"
        : updated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    el("airSource").textContent = data.mock ? "ข้อมูลจำลอง (ไม่ใช่ข้อมูลจริง)" : "ข้อมูลจาก Open-Meteo";

    el("airLoading").hidden = true;
    el("airReadout").hidden = false;
}

function loadAirQuality() {

    if (airLoaded) return;
    airLoaded = true;

    if (!hasCoords) {
        el("airLoading").hidden = true;
        const box = el("airError");
        box.hidden = false;
        box.textContent = "ไม่พบพิกัดของจังหวัดนี้ กรุณากลับไปเลือกจังหวัดใหม่จากแผนที่";
        return;
    }

    const airUrl = "https://air-quality-api.open-meteo.com/v1/air-quality" +
        `?latitude=${lat}&longitude=${lon}` +
        "&current=pm10,pm2_5,ozone,nitrogen_dioxide,carbon_monoxide,us_aqi,european_aqi" +
        "&timezone=auto";

    fetch(airUrl)
        .then(res => {
            if (!res.ok) throw new Error("air quality request failed");
            return res.json();
        })
        .then(data => {
            const c = data.current;
            if (c.pm2_5 == null) throw new Error("no pm2.5 in response");
            renderAirQuality({
                pm2_5: c.pm2_5,
                pm10: c.pm10,
                us_aqi: c.us_aqi,
                european_aqi: c.european_aqi,
                ozone: c.ozone,
                nitrogen_dioxide: c.nitrogen_dioxide,
                carbon_monoxide: c.carbon_monoxide,
                time: c.time,
                mock: false
            });
        })
        .catch(err => {
            console.warn("Air quality API unavailable, falling back to mock data:", err);
            renderAirQuality(mockAirQuality(name));
        });
}

// ---------- Tab switching ----------

const tabWeatherBtn = el("tabWeatherBtn");
const tabAirBtn = el("tabAirBtn");
const weatherView = el("weatherView");
const airView = el("airView");
const tabIndicator = el("tabIndicator");

function activateTab(tab) {
    const isWeather = tab === "weather";

    tabWeatherBtn.classList.toggle("active", isWeather);
    tabAirBtn.classList.toggle("active", !isWeather);
    tabWeatherBtn.setAttribute("aria-selected", String(isWeather));
    tabAirBtn.setAttribute("aria-selected", String(!isWeather));

    weatherView.hidden = !isWeather;
    airView.hidden = isWeather;

    tabIndicator.style.transform = isWeather ? "translateX(0)" : "translateX(calc(100% + 4px))";

    if (!isWeather) loadAirQuality();
}

tabWeatherBtn.addEventListener("click", () => activateTab("weather"));
tabAirBtn.addEventListener("click", () => activateTab("air"));

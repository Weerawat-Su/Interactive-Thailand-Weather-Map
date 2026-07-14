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

function windDirLabel(deg) {
    const idx = Math.round(deg / 45) % 8;
    return WIND_DIRS[idx];
}

function el(id) {
    return document.getElementById(id);
}

const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "ไม่ทราบจังหวัด";
const lat = parseFloat(params.get("lat"));
const lon = parseFloat(params.get("lon"));

el("provinceName").textContent = name;

if (Number.isNaN(lat) || Number.isNaN(lon)) {

    el("loading").hidden = true;
    const box = el("errorBox");
    box.hidden = false;
    box.textContent = "ไม่พบพิกัดของจังหวัดนี้ กรุณากลับไปเลือกจังหวัดใหม่จากแผนที่";

} else {

    el("provinceCoords").textContent = `lat ${lat.toFixed(4)}, lon ${lon.toFixed(4)}`;

    const url = "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,pressure_msl" +
        "&daily=temperature_2m_max,temperature_2m_min" +
        "&timezone=auto";

    fetch(url)
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

            el("loading").hidden = true;
            el("readout").hidden = false;
        })
        .catch(err => {
            el("loading").hidden = true;
            const box = el("errorBox");
            box.hidden = false;
            box.textContent = "ไม่สามารถดึงข้อมูลสภาพอากาศได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
            console.error(err);
        });
}

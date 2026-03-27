// --- Free & Reliable No-Key Weather Engine (Open-Meteo + Nominatim) ---

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun';
    }
}

// --- Weather Logic (No API Key Required!) ---
async function getWeather(inputElementId = 'cityInput') {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) return;
    const city = inputElement.value.trim();
    if (!city) {
        showError("Please enter a city name.");
        return;
    }
    fetchWeather(city);
}

async function fetchWeather(city) {
    const weatherContainer = document.getElementById("weather-display-area");
    if (!weatherContainer) return;

    weatherContainer.innerHTML = `<div class="animate-fade-in text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Analyzing atmosphere for ${city}...</p></div>`;

    try {
        // 1. Geocoding: City -> Lat/Lon
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const geoData = await geoRes.json();
        
        if (!geoData || geoData.length === 0) throw new Error("Location not found");
        
        const { lat, lon, display_name } = geoData[0];
        const cityName = display_name.split(',')[0];
        const countryName = display_name.split(',').pop().trim();

        // 2. Weather: Lat/Lon -> Real-time Data
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        if (!weatherRes.ok) throw new Error("Weather service unavailable");
        const data = await weatherRes.json();
        
        displayWeatherData(data, cityName, countryName);
        addToHistory(city);
    } catch (error) {
        showError(error.message === "Location not found" ? "We couldn't locate that city. Check the spelling or try a major region." : "Weather service is currently busy. Please try again in a moment.");
    }
}

// Mapping Open-Meteo codes to Icons & Text
const weatherCodeMap = {
    0: { text: "Clear Sky", icon: "bi-sun" },
    1: { text: "Mainly Clear", icon: "bi-cloud-sun" },
    2: { text: "Partly Cloudy", icon: "bi-cloud" },
    3: { text: "Overcast", icon: "bi-clouds" },
    45: { text: "Foggy", icon: "bi-cloud-haze" },
    48: { text: "Rime Fog", icon: "bi-cloud-haze" },
    51: { text: "Light Drizzle", icon: "bi-cloud-drizzle" },
    61: { text: "Slight Rain", icon: "bi-cloud-rain" },
    71: { text: "Slight Snow", icon: "bi-snow" },
    95: { text: "Thunderstorm", icon: "bi-cloud-lightning" }
};

function displayWeatherData(data, cityName, countryName) {
    const weatherContainer = document.getElementById("weather-display-area");
    if (!weatherContainer) return;

    const current = data.current;
    const daily = data.daily;
    const code = current.weather_code;
    const info = weatherCodeMap[code] || (code > 50 ? { text: "Rainy/Showers", icon: "bi-cloud-rain" } : { text: "Cloudy", icon: "bi-cloud" });

    weatherContainer.innerHTML = `
        <div class="glass-card animate-fade-in mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="text-start">
                    <h2 class="mb-0 fw-bold">${cityName}</h2>
                    <p class="text-secondary">${countryName}</p>
                    <p class="small text-muted">Timezone: ${data.timezone}</p>
                </div>
                <div class="text-center">
                    <i class="bi ${info.icon} display-1 mb-2 d-block text-primary"></i>
                    <h1 class="display-3 fw-bold mb-0">${current.temperature_2m}°C</h1>
                    <p class="fw-medium text-uppercase letter-spacing-1">${info.text}</p>
                </div>
            </div>

            <div class="weather-grid text-start">
                <div class="weather-detail-item">
                    <span>Feels Like</span>
                    <strong>${current.apparent_temperature}°C</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Humidity</span>
                    <strong>${current.relative_humidity_2m}%</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Wind Speed</span>
                    <strong>${current.wind_speed_10m} km/h</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Pressure</span>
                    <strong>${current.surface_pressure} hPa</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Day/Night</span>
                    <strong>${current.is_day ? 'Daytime' : 'Nighttime'}</strong>
                </div>
                <div class="weather-detail-item">
                    <span>UV Estimate</span>
                    <strong>Moderate</strong>
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-top">
                <h5 class="fw-bold mb-4">Daily Forecast</h5>
                <div class="d-flex justify-content-around text-center">
                    <div>
                        <p class="small text-secondary mb-1">Max Temp</p>
                        <p class="fw-bold h5">${daily.temperature_2m_max[0]}°C</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-1">Min Temp</p>
                        <p class="fw-bold h5">${daily.temperature_2m_min[0]}°C</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-1">Precipitation</p>
                        <p class="fw-bold h5">${daily.precipitation_probability_max[0]}%</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    const weatherContainer = document.getElementById("weather-display-area");
    if (weatherContainer) {
        weatherContainer.innerHTML = `
            <div class="glass-card text-center animate-fade-in mt-4 border-danger">
                <i class="bi bi-exclamation-triangle-fill text-danger display-4 mb-3 d-block"></i>
                <h4 class="fw-bold">Oops!</h4>
                <p class="text-secondary">${message}</p>
                <button class="btn btn-sm btn-outline-secondary mt-3 rounded-pill" onclick="location.reload()">Reset Dashboard</button>
            </div>
        `;
    }
}

// --- History Logic ---
function addToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    history = history.slice(0, 6);
    localStorage.setItem('weatherHistory', JSON.stringify(history));
    updateHistoryUI();
}

function updateHistoryUI() {
    const historyContainer = document.getElementById("search-history");
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    if (history.length === 0) {
        historyContainer.innerHTML = "";
        return;
    }

    historyContainer.innerHTML = `
        <h6 class="text-secondary fw-bold mb-3 mt-4 small text-uppercase">Recent Analytics</h6>
        <div class="d-flex flex-wrap gap-2 justify-content-center">
            ${history.map(city => `
                <button class="btn btn-sm glass-pill px-3 py-2" onclick="fetchWeather('${city}')">
                    ${city}
                </button>
            `).join('')}
            <button class="btn btn-sm text-danger border-0 small" onclick="clearHistory()">Clear</button>
        </div>
    `;
}

function clearHistory() {
    localStorage.removeItem('weatherHistory');
    updateHistoryUI();
}

// --- Init on Load ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateHistoryUI();
    
    // Auto-fetch default city
    const lastCity = JSON.parse(localStorage.getItem('weatherHistory') || '[]')[0] || "Solapur";
    if (document.getElementById("weather-display-area")) {
        fetchWeather(lastCity);
    }
    
    const cityInput = document.getElementById("cityInput");
    if (cityInput) {
        cityInput.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') getWeather();
        });
    }
});

window.toggleTheme = toggleTheme;
window.getWeather = getWeather;
window.fetchWeather = fetchWeather;
window.clearHistory = clearHistory;

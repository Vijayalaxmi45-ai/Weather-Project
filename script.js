const apiKey = "c3d4a9e1b9f7497f91d115503253004"; // WeatherAPI key

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

// --- Weather Logic ---
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

    weatherContainer.innerHTML = `<div class="animate-fade-in text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Fetching weather data...</p></div>`;

    try {
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=3&aqi=yes`);
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();
        
        displayWeatherData(data);
        addToHistory(city);
    } catch (error) {
        showError("Could not find that city. Please try again.");
    }
}

function displayWeatherData(data) {
    const weatherContainer = document.getElementById("weather-display-area");
    if (!weatherContainer) return;

    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday[0].day;

    weatherContainer.innerHTML = `
        <div class="glass-card animate-fade-in mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="text-start">
                    <h2 class="mb-0 fw-bold">${location.name}</h2>
                    <p class="text-secondary">${location.region}, ${location.country}</p>
                    <p class="small text-muted">Local Time: ${location.localtime}</p>
                </div>
                <div class="text-center">
                    <img src="https:${current.condition.icon}" alt="Weather" width="80">
                    <h1 class="display-3 fw-bold mb-0">${current.temp_c}°C</h1>
                    <p class="fw-medium">${current.condition.text}</p>
                </div>
            </div>

            <div class="weather-grid text-start">
                <div class="weather-detail-item">
                    <span>Feels Like</span>
                    <strong>${current.feelslike_c}°C</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Humidity</span>
                    <strong>${current.humidity}%</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Wind Speed</span>
                    <strong>${current.wind_kph} km/h</strong>
                </div>
                <div class="weather-detail-item">
                    <span>UV Index</span>
                    <strong>${current.uv}</strong>
                </div>
                <div class="weather-detail-item">
                    <span>AQI (US)</span>
                    <strong>${current.air_quality['us-epa-index']}</strong>
                </div>
                <div class="weather-detail-item">
                    <span>Pressure</span>
                    <strong>${current.pressure_mb} mb</strong>
                </div>
            </div>
            
            <div class="mt-4 pt-3 border-top">
                <h5 class="fw-bold mb-3">Today's Forecast</h5>
                <div class="d-flex justify-content-around text-center">
                    <div>
                        <p class="small text-secondary mb-1">Max Temp</p>
                        <p class="fw-bold">${forecast.maxtemp_c}°C</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-1">Min Temp</p>
                        <p class="fw-bold">${forecast.mintemp_c}°C</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-1">Chance of Rain</p>
                        <p class="fw-bold">${forecast.daily_chance_of_rain}%</p>
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
            </div>
        `;
    }
}

// --- History & Favorites (The "Database") ---
function addToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    // Filter out if city already exists
    history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
    // Add to front and limit to 5
    history.unshift(city);
    history = history.slice(0, 5);
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
        <h6 class="text-secondary fw-bold mb-3 mt-4">Recent Searches</h6>
        <div class="d-flex flex-wrap gap-2 justify-content-center">
            ${history.map(city => `
                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="fetchWeather('${city}')">
                    ${city}
                </button>
            `).join('')}
            <button class="btn btn-sm text-danger border-0" onclick="clearHistory()">Clear All</button>
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
    
    // Auto-fetch current location if possible, or show default
    const defaultCities = ["London", "New York", "Tokyo", "Mumbai", "Sydney"];
    const randomCity = defaultCities[Math.floor(Math.random() * defaultCities.length)];
    
    // Only fetch if on index page or weather page
    if (document.getElementById("weather-display-area")) {
        fetchWeather(randomCity);
    }
    
    // Listen for Enter key on inputs
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

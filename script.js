// Weather API Configuration
const API_BASE_URL = 'https://meteostat.p.rapidapi.com';
const API_KEY = '13c4f65c0emsh09b757a688d2992p1d55d8jsn912739151492';
const API_HOST = 'meteostat.p.rapidapi.com';

// DOM Elements
const weatherForm = document.getElementById('weatherForm');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const endpointSelect = document.getElementById('endpoint');
const weatherResults = document.getElementById('weatherResults');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const quickLocationButtons = document.querySelectorAll('.quick-location');

// Weather Icons Mapping
const weatherIcons = {
    'clear': 'bi-sun',
    'cloudy': 'bi-cloud',
    'rainy': 'bi-cloud-rain',
    'snowy': 'bi-cloud-snow',
    'stormy': 'bi-cloud-lightning',
    'foggy': 'bi-cloud-fog',
    'partly-cloudy': 'bi-cloud-sun',
    'sunny': 'bi-sun',
    'overcast': 'bi-cloud',
    'rain': 'bi-cloud-rain',
    'snow': 'bi-cloud-snow',
    'thunderstorm': 'bi-cloud-lightning',
    'mist': 'bi-cloud-fog',
    'fog': 'bi-cloud-fog'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set default coordinates (Delhi)
    latitudeInput.value = '28.6139';
    longitudeInput.value = '77.2090';
    
    // Add event listeners
    weatherForm.addEventListener('submit', handleWeatherFormSubmit);
    quickLocationButtons.forEach(button => {
        button.addEventListener('click', handleQuickLocationClick);
    });
});

// Handle form submission
async function handleWeatherFormSubmit(event) {
    event.preventDefault();
    
    const latitude = latitudeInput.value;
    const longitude = longitudeInput.value;
    const endpoint = endpointSelect.value;
    
    if (!latitude || !longitude) {
        showError('Please enter both latitude and longitude coordinates.');
        return;
    }
    
    await fetchWeatherData(latitude, longitude, endpoint);
}

// Handle quick location button clicks
async function handleQuickLocationClick(event) {
    const button = event.currentTarget;
    const lat = button.dataset.lat;
    const lon = button.dataset.lon;
    const name = button.dataset.name;
    
    // Update form inputs
    latitudeInput.value = lat;
    longitudeInput.value = lon;
    
    // Get weather data
    await fetchWeatherData(lat, lon, endpointSelect.value, name);
}

// Fetch weather data from API
async function fetchWeatherData(latitude, longitude, endpoint, locationName = null) {
    showLoading(true);
    hideError();
    
    try {
        // Construct URL based on endpoint type
        let url;
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setDate(currentDate.getDate() - 7); // Get data for last 7 days
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = currentDate.toISOString().split('T')[0];
        
        switch (endpoint) {
            case 'current':
                url = `${API_BASE_URL}/point/daily?lat=${latitude}&lon=${longitude}&start=${startDateStr}&end=${endDateStr}`;
                break;
            case 'daily':
                url = `${API_BASE_URL}/point/daily?lat=${latitude}&lon=${longitude}&start=${startDateStr}&end=${endDateStr}`;
                break;
            case 'hourly':
                url = `${API_BASE_URL}/point/hourly?lat=${latitude}&lon=${longitude}&start=${startDateStr}&end=${endDateStr}`;
                break;
            default:
                url = `${API_BASE_URL}/point/daily?lat=${latitude}&lon=${longitude}&start=${startDateStr}&end=${endDateStr}`;
        }
        
        console.log('Fetching from URL:', url);
        
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST
            }
        };
        
        const response = await fetch(url, options);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error('No weather data received from API');
        }
        
        displayWeatherData(data, endpoint, locationName);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(`Failed to fetch weather data: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Display weather data
function displayWeatherData(data, endpoint, locationName) {
    let html = '';
    
    // Header with location
    const location = locationName || `Location (${data.latitude || 'Unknown'}, ${data.longitude || 'Unknown'})`;
    html += `
        <div class="row justify-content-center mb-4">
            <div class="col-md-10">
                <h2 class="text-center">
                    <i class="bi bi-geo-alt"></i> Weather in ${location}
                </h2>
                <p class="text-center text-muted">
                    <i class="bi bi-calendar"></i> ${new Date().toLocaleDateString()} | 
                    <i class="bi bi-clock"></i> ${new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    `;
    
    // Display data based on endpoint type
    switch (endpoint) {
        case 'current':
            html += displayCurrentWeather(data);
            break;
        case 'daily':
            html += displayDailyForecast(data);
            break;
        case 'hourly':
            html += displayHourlyForecast(data);
            break;
        default:
            html += displayGenericData(data);
    }
    
    weatherResults.innerHTML = html;
}

// Display current weather
function displayCurrentWeather(data) {
    console.log('Current weather data:', data);
    
    // Handle Meteostat data structure
    let current = data;
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        current = data.data[data.data.length - 1]; // Get the most recent data
    }
    
    const temp = current.tavg || current.temp || current.temperature || 'N/A';
    const condition = getWeatherConditionFromTemp(temp);
    const humidity = current.rhum || current.humidity || 'N/A';
    const windSpeed = current.wspd || current.wind_speed || 'N/A';
    
    return `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card weather-card shadow-lg">
                    <div class="card-body text-center p-5">
                        <div class="weather-icon mb-3">
                            <i class="bi ${getWeatherIcon(condition)} text-primary"></i>
                        </div>
                        <h1 class="display-4 fw-bold text-primary">${temp}°C</h1>
                        <h4 class="text-muted mb-4">${condition}</h4>
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="border-end">
                                    <h6 class="text-muted">Humidity</h6>
                                    <p class="h5">${humidity}%</p>
                                </div>
                            </div>
                            <div class="col-6">
                                <h6 class="text-muted">Wind Speed</h6>
                                <p class="h5">${windSpeed} km/h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display daily forecast
function displayDailyForecast(data) {
    console.log('Daily forecast data:', data);
    
    // Handle Meteostat data structure
    let daily = data;
    if (data.data && Array.isArray(data.data)) {
        daily = data.data;
    }
    
    let html = '<div class="row justify-content-center">';
    
    if (Array.isArray(daily) && daily.length > 0) {
        daily.slice(0, 7).forEach((day, index) => {
            const date = new Date(day.date || new Date());
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = day.tavg || day.temp || day.temperature || 'N/A';
            const condition = getWeatherConditionFromTemp(temp);
            
            html += `
                <div class="col-md-2 col-sm-4 col-6 mb-3">
                    <div class="card weather-card h-100 shadow">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">${dayName}</h6>
                            <div class="weather-icon mb-2">
                                <i class="bi ${getWeatherIcon(condition)} text-primary"></i>
                            </div>
                            <h5 class="fw-bold">${temp}°C</h5>
                            <small class="text-muted">${condition}</small>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="col-12"><p class="text-center text-muted">No daily forecast data available</p></div>';
    }
    
    html += '</div>';
    return html;
}

// Display hourly forecast
function displayHourlyForecast(data) {
    console.log('Hourly forecast data:', data);
    
    // Handle Meteostat data structure
    let hourly = data;
    if (data.data && Array.isArray(data.data)) {
        hourly = data.data;
    }
    
    let html = '<div class="row justify-content-center">';
    
    if (Array.isArray(hourly) && hourly.length > 0) {
        hourly.slice(0, 24).forEach((hour, index) => {
            const time = new Date(hour.time || new Date());
            const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const temp = hour.temp || hour.temperature || 'N/A';
            const condition = getWeatherConditionFromTemp(temp);
            
            html += `
                <div class="col-md-2 col-sm-3 col-4 mb-3">
                    <div class="card weather-card h-100 shadow-sm">
                        <div class="card-body text-center p-3">
                            <h6 class="card-title text-muted small">${timeString}</h6>
                            <div class="weather-icon mb-2">
                                <i class="bi ${getWeatherIcon(condition)} text-primary"></i>
                            </div>
                            <h6 class="fw-bold">${temp}°C</h6>
                            <small class="text-muted">${condition}</small>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="col-12"><p class="text-center text-muted">No hourly forecast data available</p></div>';
    }
    
    html += '</div>';
    return html;
}

// Display generic data (fallback)
function displayGenericData(data) {
    console.log('Generic data:', data);
    return `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-body">
                        <h5 class="card-title">Weather Data</h5>
                        <pre class="bg-light p-3 rounded">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get weather condition based on temperature
function getWeatherConditionFromTemp(temp) {
    if (temp === 'N/A' || temp === null || temp === undefined) {
        return 'Unknown';
    }
    
    const tempNum = parseFloat(temp);
    if (isNaN(tempNum)) return 'Unknown';
    
    if (tempNum < 0) return 'Snow';
    if (tempNum < 10) return 'Cold';
    if (tempNum < 20) return 'Cool';
    if (tempNum < 25) return 'Mild';
    if (tempNum < 30) return 'Warm';
    return 'Hot';
}

// Get weather icon based on condition
function getWeatherIcon(condition) {
    if (!condition) return weatherIcons.cloudy;
    
    const conditionLower = condition.toString().toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny') || conditionLower.includes('warm') || conditionLower.includes('hot')) {
        return weatherIcons.clear;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast') || conditionLower.includes('mild')) {
        return weatherIcons.cloudy;
    } else if (conditionLower.includes('rain') || conditionLower.includes('cool')) {
        return weatherIcons.rainy;
    } else if (conditionLower.includes('snow') || conditionLower.includes('cold')) {
        return weatherIcons.snowy;
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
        return weatherIcons.stormy;
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
        return weatherIcons.foggy;
    } else {
        return weatherIcons['partly-cloudy'];
    }
}

// Show loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'block';
        weatherResults.innerHTML = '';
    } else {
        loadingSpinner.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    weatherResults.innerHTML = '';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Utility function to format temperature
function formatTemperature(temp) {
    if (temp === null || temp === undefined || temp === 'N/A') {
        return 'N/A';
    }
    return `${Math.round(temp)}°C`;
}

// Utility function to format wind speed
function formatWindSpeed(speed) {
    if (speed === null || speed === undefined || speed === 'N/A') {
        return 'N/A';
    }
    return `${Math.round(speed)} km/h`;
}
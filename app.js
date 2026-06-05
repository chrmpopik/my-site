(function () {
	var weatherEmoji = document.getElementById("weather-emoji");
	var weatherTemp = document.getElementById("weather-temp");
	var weatherToday = document.getElementById("weather-today");
	var weatherDesc = document.getElementById("weather-desc");
	var weatherLocation = document.getElementById("weather-location");
	var weatherRecommendation = document.getElementById("weather-recommendation");
	var weatherForecast = document.getElementById("weather-forecast");
	var weatherMeta = document.getElementById("weather-meta");

	function weatherPresentation(code) {
		if (code === 0) return { emoji: "☀️", label: "Clear sky" };
		if (code >= 1 && code <= 3) return { emoji: "☁️", label: "Cloudy" };
		if (code === 45 || code === 48) return { emoji: "🌫️", label: "Fog" };
		if ((code >= 51 && code <= 57) || (code >= 80 && code <= 82)) return { emoji: "🌧️", label: "Rain" };
		if ((code >= 61 && code <= 67)) return { emoji: "🌧️", label: "Rain" };
		if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { emoji: "❄️", label: "Snow" };
		if (code >= 95 && code <= 99) return { emoji: "⛈️", label: "Thunderstorm" };
		return { emoji: "🌤️", label: "Mild" };
	}

	function activityRecommendation(code, temperature) {
		if (code === 0) {
			return temperature >= 78 ? "Perfect for a patio lunch, park walk, or sunset ice cream run." : "Great for a relaxed coffee walk or an easy neighborhood stroll.";
		}
		if (code >= 1 && code <= 3) {
			return "Try a museum visit, cafe hop, or a long walk with a cozy stop at the end.";
		}
		if (code === 45 || code === 48) {
			return "Lean into a bookstore trip, brunch, or a slow indoor reset.";
		}
		if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
			return "Make it a rainy-day adventure: gallery time, a movie, or your favorite cafe.";
		}
		if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
			return "Bundle up for a scenic walk, hot chocolate, or a cozy indoor creative project.";
		}
		if (code >= 95 && code <= 99) {
			return "Skip the outdoor plan and save this day for board games, baking, or a streaming night.";
		}
		if (temperature >= 85) {
			return "Keep it light and shady: early errands, shaded walks, or a water break somewhere cool.";
		}
		if (temperature <= 55) {
			return "A crisp day for a brisk walk, a warm meal, and something cozy afterward.";
		}
		return "A nice day for a casual walk, coffee stop, or easy local adventure.";
	}

	function setRecommendation(text) {
		weatherRecommendation.hidden = false;
		weatherRecommendation.innerHTML = '<strong>What to do</strong><span>' + text + '</span>';
	}

	function setWeatherState(emoji, tempText, descText, locationText, recommendationText, metaText) {
		weatherEmoji.textContent = emoji;
		weatherTemp.textContent = tempText;
		weatherToday.textContent = formatTodayDate(new Date());
		weatherDesc.textContent = descText;
		weatherLocation.hidden = false;
		weatherLocation.textContent = locationText;
		setRecommendation(recommendationText);
		weatherMeta.textContent = metaText;
	}

	function hasLocationName(result) {
		if (!result) {
			return false;
		}

		return Boolean(
			result.city ||
			result.town ||
			result.village ||
			result.municipality ||
			result.locality ||
			result.name ||
			result.admin1 ||
			result.state ||
			result.region
		);
	}

	function cleanCityName(cityName) {
		if (!cityName) {
			return cityName;
		}

		return cityName.replace(/^City of\s+/i, "").trim();
	}

	function formatForecastDate(dateString) {
		var date = new Date(dateString + "T12:00:00");
		return new Intl.DateTimeFormat("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric"
		}).format(date);
	}

	function formatTodayDate(date) {
		return new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "short",
			day: "numeric"
		}).format(date);
	}

	function renderForecast(daily) {
		if (!daily || !daily.time || !daily.weather_code || !daily.temperature_2m_max) {
			weatherForecast.hidden = true;
			weatherForecast.innerHTML = "";
			return;
		}

		var items = [];

		for (var index = 1; index < Math.min(5, daily.time.length); index += 1) {
			var details = weatherPresentation(daily.weather_code[index]);
			items.push([
				'<div class="weather-forecast-item">',
				'<div class="weather-forecast-date">' + formatForecastDate(daily.time[index]) + '</div>',
				'<div class="weather-forecast-icon" aria-hidden="true">' + details.emoji + '</div>',
				'<div class="weather-forecast-temp">' + Math.round(daily.temperature_2m_max[index]) + '°F</div>',
				'</div>'
			].join(""));
		}

		weatherForecast.innerHTML = items.join("");
		weatherForecast.hidden = items.length === 0;
	}

	function formatLocation(result, latitude, longitude) {
		if (!result) {
			return "Lat " + latitude.toFixed(2) + ", Lon " + longitude.toFixed(2);
		}

		var city = cleanCityName(result.city || result.town || result.village || result.municipality || result.locality || result.name || result.county);
		var state = result.admin1 || result.state || result.region || result.county;
		var country = result.country;

		if (city && state) {
			return "📍 " + city + ", " + state;
		}

		if (city && country) {
			return "📍 " + city + ", " + country;
		}

		if (city) {
			return "📍 " + city;
		}

		if (state && country) {
			return "📍 " + state + ", " + country;
		}

		if (state) {
			return "📍 " + state;
		}

		if (country) {
			return "📍 " + country;
		}

		return "Lat " + latitude.toFixed(2) + ", Lon " + longitude.toFixed(2);
	}

	function fetchLocationLabel(latitude, longitude) {
		var openMeteoEndpoint = "https://geocoding-api.open-meteo.com/v1/reverse?latitude=" + encodeURIComponent(latitude) + "&longitude=" + encodeURIComponent(longitude) + "&count=1&language=en&format=json";
		var nominatimEndpoint = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + encodeURIComponent(latitude) + "&lon=" + encodeURIComponent(longitude) + "&zoom=10&addressdetails=1";

		return fetch(openMeteoEndpoint)
			.then(function (response) {
				if (!response.ok) {
					throw new Error("Open-Meteo location request failed");
				}
				return response.json();
			})
			.then(function (locationData) {
				var result = locationData && locationData.results && locationData.results[0];

				if (hasLocationName(result)) {
					return formatLocation(result, latitude, longitude);
				}

				throw new Error("Open-Meteo reverse geocoding missing location name");
			})
			.catch(function () {
				return fetch(nominatimEndpoint)
					.then(function (response) {
						if (!response.ok) {
							throw new Error("Nominatim location request failed");
						}
						return response.json();
					})
					.then(function (locationData) {
						var address = locationData && locationData.address ? locationData.address : null;
						if (address) {
							return formatLocation({
								city: address.city || address.town || address.village || address.hamlet || address.suburb || address.county,
								state: address.state || address.region,
								country: address.country
							}, latitude, longitude);
						}

						return formatLocation(null, latitude, longitude);
					})
					.catch(function () {
						return formatLocation(null, latitude, longitude);
					});
			});
	}

	if (!navigator.geolocation) {
		setWeatherState("📍", "Location unavailable", "Geolocation is not supported by this browser", "Location unavailable", "Try an easy indoor plan like reading, a cafe stop, or a movie.", "Weather unavailable");
		return;
	}

	navigator.geolocation.getCurrentPosition(function (position) {
		var lat = position.coords.latitude;
		var lon = position.coords.longitude;
		var weatherEndpoint = "https://api.open-meteo.com/v1/forecast?latitude=" + encodeURIComponent(lat) + "&longitude=" + encodeURIComponent(lon) + "&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&forecast_days=5&temperature_unit=fahrenheit&timezone=auto";

		fetch(weatherEndpoint)
			.then(function (response) {
				if (!response.ok) {
					throw new Error("Weather request failed");
				}
				return response.json();
			})
			.then(function (weatherData) {
				if (!weatherData || !weatherData.current) {
					throw new Error("No weather data returned");
				}

				var temperature = Math.round(weatherData.current.temperature_2m);
				var code = weatherData.current.weather_code;
				var details = weatherPresentation(code);
				var recommendationText = activityRecommendation(code, temperature);
				setWeatherState(details.emoji, temperature + "°F", details.label, "Location loading...", recommendationText, "Based on your current location");
				renderForecast(weatherData.daily);

				fetchLocationLabel(lat, lon).then(function (locationText) {
					weatherLocation.textContent = locationText;
				});
			})
			.catch(function () {
				setWeatherState("⚠️", "Weather unavailable", "Could not load forecast right now", "Location unavailable", "Try an easy indoor plan like reading, a cafe stop, or a movie.", "Please try again in a moment");
			});
	}, function () {
		setWeatherState("📍", "Location needed", "Enable location to see your weather.", "Location unavailable", "Enable location to get a local activity recommendation.", "Open-Meteo forecast requires coordinates");
	});
})();

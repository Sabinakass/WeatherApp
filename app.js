require('dotenv').config();
const express = require("express");
const app = express();
const https = require("https");

app.use(express.static("public"));


app.get("/weather", (req, res) => {
  const city = req.query.city;
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`;
  
  https.get(weatherUrl, function (weatherResponse) {
    let weatherData = '';

    weatherResponse.on("data", function (chunk) {
      weatherData += chunk;
    });

    weatherResponse.on("end", function () {
      const weatherJson = JSON.parse(weatherData);
      const aqiUrl = `https://api.weatherbit.io/v2.0/current?city=${city}&key=${process.env.WEATHERBIT_API_KEY}&include=minutely`;

      https.get(aqiUrl, function (aqiResponse) {
        let aqiData = '';

        aqiResponse.on('data', function (chunk) {
          aqiData += chunk;
        });

        aqiResponse.on('end', function () {
          const aqiJson = JSON.parse(aqiData);
          const aqi = aqiJson.data[0].aqi;
          let aqiStatus = determineAQILevel(aqi);
          
          sendResponse(res, city, weatherJson, aqi, aqiStatus);
        });
      });
    });
  });
});

function determineAQILevel(aqi) {
  if (aqi <= 50) {
    return "Good";
  } else if (aqi <= 100) {
    return "Moderate";
  } else if (aqi <= 150) {
    return "Unhealthy for Sensitive Groups";
  } else if (aqi <= 200) {
    return "Unhealthy";
  } else if (aqi <= 300) {
    return "Very Unhealthy";
  } else {
    return "Hazardous";
  }
}

function sendResponse(res, city, weatherData, aqi, aqiStatus) {
  
  const temp = weatherData.main.temp;
  const description = weatherData.weather[0].description;
      const icon = weatherData.weather[0].icon;
      const imageURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;
      const lon = weatherData.coord.lon;
      const lat = weatherData.coord.lat;
      const feelsLike = weatherData.main.feels_like;
      const humidity = weatherData.main.humidity;
      const pressure = weatherData.main.pressure;
      const wind_speed = weatherData.wind.speed;
      const country_code = weatherData.sys.country;
      let rain = "No rain data for the last 3 hours";
      if (weatherData.rain && weatherData.rain['3h']) {
        rain = `${weatherData.rain['3h']} mm`;
      }


      res.write(`
      <html>
      <head>
          <title>Weather Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; background-color: #e0f2f1; padding: 20px;">
      <h1 style="color: #0d47a1;">Weather Forecast</h1>
          <h2 style="color: #1a237e;">${city}</h2>
          <p style="font-size: 20px;">The temperature is <strong>${temp} &deg;C</strong>.</p>
          <p style="color: #4a148c; font-size: 18px;">The weather is currently <em>${description}</em>.</p>
          <img src="${imageURL}" alt="Weather Icon" style="border: 5px solid #4a148c; border-radius: 10px; margin-top: 10px;">
          <div style="margin-top: 20px; background-color: #f3f3f3; padding: 10px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
              <p style="color: #333; font-size: 16px;">Coordinates: ${lon}, ${lat}</p>
              <p style="color: #333; font-size: 16px;">Country: ${country_code}</p>
              <p style="color: #333; font-size: 16px;">Feels-like Temperature: ${feelsLike} &deg;C</p>
              <p style="color: #333; font-size: 16px;">Humidity: ${humidity}%</p>
              <p style="color: #333; font-size: 16px;">Pressure: ${pressure} hPa</p>
              <p style="color: #333; font-size: 16px;">Wind Speed: ${wind_speed} m/s</p>
              <p style="color: #333; font-size: 16px;">Rain Volume (3 hrs): ${rain}</p>
              <p style="color: #333; font-size: 16px;">Air Quality Index (AQI): ${aqi} <p style="color:red;display:inline;">(${aqiStatus})</p></p>
          </div>
          <div id="map" style="height: 400px; margin top:50px;"></div>

          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <script>
            var map = L.map('map', {
              zoomControl: false
            }).setView([${lat}, ${lon}], 13);
        
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        
            L.marker([${lat}, ${lon}]).addTo(map)
              .bindPopup('<b>${city}').openPopup();
          </script>
          <footer style="margin-top: 30px; font-size: 12px; color: #424242;">
              <p>Powered by Kassymova Sabina</p>
          </footer>
      </body>
      </html>
    `);
  res.send();
}






const port = 3000;
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

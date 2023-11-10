// 使用Fetch API获取CSV文件并将其转换为GeoJSON
function csvToGeoJSON(fileUrl, callback) {
    const geojson = {
        type: 'FeatureCollection',
        features: []
    };

    // 使用Fetch API获取CSV文件
    fetch(fileUrl)
        .then(response => response.text())
        .then(csvData => {
            // 使用PapaParse解析CSV数据
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    results.data.forEach(row => {
                        const feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
                            },
                            properties: row
                        };
                        geojson.features.push(feature);
                    });
                    callback(null, geojson);
                },
                error: function (error) {
                    callback(error, null);
                }
            });
        })
        .catch(error => {
            callback(error, null);
        });
}

// 添加站点数据图层
function addStationsLayer() {
    // 读取包含新数据的JSON文件
    fetch('./data/hour_data/hour_data.json')
        .then(response => response.json())
        .then(hourData => {
            // 将CSV数据转换为GeoJSON
            csvToGeoJSON('./data/1085_stations.csv', (error, geojsonData) => {
                if (error) {
                    console.error('Error:', error);
                } else {
                    // 更新geojsonData中的pm25值
                    geojsonData.features.forEach((feature, index) => {
                        feature.properties.pm25 = hourData[index].air["PM2.5"];
                        feature.properties.pm10 = hourData[index].air["PM10"];
                        feature.properties.no2 = hourData[index].air["NO2"];
                        feature.properties.co = hourData[index].air["CO"];
                        feature.properties.o3 = hourData[index].air["O3"];
                        feature.properties.so2 = hourData[index].air["SO2"];
                        feature.properties.rainfall = hourData[index].tmp["Rainfall"];
                        feature.properties.temperature = hourData[index].tmp["Temperature"];
                        feature.properties.pressure = hourData[index].tmp["Pressure"];
                        feature.properties.humidity = hourData[index].tmp["Humidity"];
                        feature.properties.windSpeed = hourData[index].tmp["Wind Speed"];
                        feature.properties.windDirection = getWindDirectionDescription(hourData[index].tmp["Wind Direction"]);
                        feature.properties.weather = getWeatherDescription(hourData[index].tmp["Weather"]);
                    });

                    console.log(geojsonData);

                    // 添加数据源
                    map.addSource('stations', {
                        type: 'geojson',
                        data: geojsonData
                    });

                    // 添加数据图层，使用基于PM2.5值的动态圆圈颜色
                    map.addLayer({
                        id: '1085-stations-1cyyg4',
                        type: 'circle',
                        source: 'stations',
                        paint: {
                            'circle-radius': 5,
                            'circle-color': [
                                'case',
                                ['<', ['get', 'pm25'], 12], 'rgb(206, 199, 255)',
                                ['<', ['get', 'pm25'], 36], 'rgb(164, 151, 253)',
                                ['<', ['get', 'pm25'], 56], 'rgb(143, 129, 238)',
                                ['<', ['get', 'pm25'], 151], 'rgb(120, 103, 235)',
                                ['<', ['get', 'pm25'], 251], 'rgb(106, 92, 216)',
                                'rgb(88, 77, 174)'
                            ],
                            'circle-stroke-color': 'white',
                            'circle-stroke-width': 1
                        },
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error reading JSON file:', error);
        });
}

// 获取风向描述
function getWindDirectionDescription(windDirection) {
    switch (windDirection) {
        case 0:
            return "无风";
        case 1:
            return "东风";
        case 2:
            return "西风";
        case 3:
            return "南风";
        case 4:
            return "北风";
        case 9:
            return "风向不定";
        case 13:
            return "东南风";
        case 14:
            return "东北风";
        case 23:
            return "西南风";
        case 24:
            return "西北风";
        default:
            return "未知";
    }
}

// 获取天气描述
function getWeatherDescription(weatherClass) {
    switch (weatherClass) {
        case 0:
            return "晴";
        case 1:
            return "多云";
        case 2:
            return "阴";
        case 3:
            return "雨";
        case 4:
            return "小雨";
        case 5:
            return "中雨";
        case 6:
            return "大雨";
        case 7:
            return "暴雨";
        case 8:
            return "雷雨";
        case 9:
            return "冻雨";
        case 10:
            return "雪";
        case 11:
            return "小雪";
        case 12:
            return "中雪";
        case 13:
            return "大雪";
        case 14:
            return "雾";
        case 15:
            return "沙尘暴";
        case 16:
            return "扬沙";
        default:
            return "未知";
    }
}

// 判断是否在中国范围内
function isWithinBounds(lngLat) {
    const minLng = 73.683851;
    const maxLng = 135.383069;
    const minLat = 18.424216;
    const maxLat = 53.714166;

    return lngLat.lng >= minLng && lngLat.lng <= maxLng && lngLat.lat >= minLat && lngLat.lat <= maxLat;
}

// 模拟真实数据查询
function fetchDataForLocation(lngLat, callback) {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const data = {
        pm25: getRandomInt(0, 500),          // PM2.5的范围: 0-500 μg/m³
        pm10: getRandomInt(0, 1000),         // PM10的范围: 0-1000 μg/m³
        no2: getRandomInt(0, 200),           // NO2的范围: 0-200 ppb
        co: getRandomInt(0, 10),             // CO的范围: 0-10 ppm
        o3: getRandomInt(0, 500),            // O3的范围: 0-500 ppb
        so2: getRandomInt(0, 500),           // SO2的范围: 0-500 ppb
        rainfall: getRandomInt(0, 50),     // 降雨量的范围: 0-50 mm
        temperature: getRandomInt(-30, 50),  // 温度的范围: -30-50 °C
        pressure: getRandomInt(900, 1100),   // 气压的范围: 900-1100 hPa
        humidity: getRandomInt(0, 100),      // 湿度的范围: 0-100 %
        windSpeed: getRandomInt(0, 30),    // 风速的范围: 0-30 m/s
        windDirection: getWeatherDescription(0, 16), // 风向的范围: 0-360°
        weather: getWindDirectionDescription(getRandomInt(0, 4))          // 随机天气情况
    };
    callback(data);
}

// 获取污染水平
function getPollutionLevel(pm25) {
    if (pm25 <= 50) {
        return {level: '优', color: '#00FF00'};
    } else if (pm25 <= 100) {
        return {level: '良', color: '#FFFF00'};
    } else if (pm25 <= 150) {
        return {level: '轻度污染', color: '#FFA500'};
    } else if (pm25 <= 200) {
        return {level: '中度污染', color: '#FF4500'};
    } else if (pm25 <= 300) {
        return {level: '重度污染', color: '#FF0000'};
    } else {
        return {level: '严重污染', color: '#8B0000'};
    }
}

// 生成弹出框内容
function generatePopupContent(data) {
    function generateIndicatorWithColorBox(indicatorName, value) {
        function getColorForValue(value) {
            if (value <= 50) return '#00FF00';       // 绿色
            if (value <= 100) return '#FFFF00';      // 黄色
            if (value <= 150) return '#FFA500';      // 橙色
            if (value <= 200) return '#FF4500';      // 浅红色
            if (value <= 300) return '#FF0000';      // 红色
            return '#8B0000';                        // 深红色
        }

        const color = getColorForValue(value);
        return `
        <div>${indicatorName}</div>
        <div style="width: 12px; height: 12px; background-color: ${color}; margin: 5px 5px;"></div>
        <div style="padding-left: 12px">${value}</div>
    `;
    }

    const pollution = getPollutionLevel(data.pm25);
    const now = new Date();
    const hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');  // 保证分钟总是两位数
    const amPm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime = `更新于 ${hours}:${minutes} ${amPm}`;
    return `
        <div style="display: grid; grid-template-columns: auto 14px auto;">
            <div style="grid-column: 1 / span 3; display: flex; align-items: center; justify-content: flex-start; margin: 0 0 8px 0">
                <div style="width: 6px; height: 12px; background-color: ${pollution.color};"></div>
                <div style="padding-left: 8px">${pollution.level}</div>
            </div>
            ${generateIndicatorWithColorBox('PM2.5', data.pm25)}
            ${generateIndicatorWithColorBox('PM10', data.pm10)}
            ${generateIndicatorWithColorBox('NO2', data.no2)}
            ${generateIndicatorWithColorBox('CO', data.co)}
            ${generateIndicatorWithColorBox('O3', data.o3)}
            ${generateIndicatorWithColorBox('SO2', data.so2)}
            <div> Rainfall</div> <div><i style="margin: 5px 5px;" class="fas fa-cloud-rain"></i></div> <div style="padding-left: 12px">${data.rainfall.toFixed(2)} mm</div>
            <div> Temperature</div> <div><i style="margin: 5px 5px;" class="fas fa-thermometer"></i></div> <div style="padding-left: 12px">${data.temperature.toFixed(2)} °C</div>
            <div> Pressure</div> <div><i style="margin: 5px 5px;" class="fas fa-tachometer-alt"></i></div> <div style="padding-left: 12px">${data.pressure.toFixed(2)} hPa</div>
            <div> Humidity</div> <div><i style="margin: 5px 5px;" class="fas fa-water"></i></div> <div style="padding-left: 12px">${data.humidity.toFixed(2)} %</div>
            <div> Wind Speed</div> <div><i style="margin: 5px 5px;" class="fas fa-wind"></i></div> <div style="padding-left: 12px">${data.windSpeed.toFixed(2)} m/s</div>
            <div> Wind Direction</div> <div><i style="margin: 5px 5px;" class="fas fa-location-arrow"></i></div> <div style="padding-left: 12px">${data.windDirection}°</div>
            <div> Weather</div> <div><i style="margin: 5px 5px;" class="fas fa-smog"></i></div> <div style="padding-left: 12px">${data.weather}</div>
            <div style="grid-column: 1 / span 2; color: steelblue; padding-top: 8px">${formattedTime}</div>
        </div>
    `;
}
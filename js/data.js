// Function to convert CSV to GeoJSON using Fetch API and PapaParse library
function csvToGeoJSON(fileUrl, callback) {
    const geojson = {
        type: 'FeatureCollection',
        features: []
    };

    // Fetch the CSV file using Fetch API
    fetch(fileUrl)
        .then(response => response.text())
        .then(csvData => {
            // Parse CSV data using PapaParse
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    results.data.forEach(row => {
                        const feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [parseFloat(row.Longitude), parseFloat(row.Latitude)]
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

// Function to add a stations layer to the map
function addStationsLayer() {
    // Prepare fetch requests for both CSV files
    const fetchTrueCsv = fetch('./data/true.csv').then(response => response.text());
    const fetchPredCsv = fetch('./data/pred.csv').then(response => response.text());

    // Use Promise.all to handle both fetch requests
    Promise.all([fetchTrueCsv, fetchPredCsv])
        .then(results => {
            // results[0] will be the response from true.csv
            // results[1] will be the response from pred.csv
            // Parse both CSV files
            const parseTrueCsv = Papa.parse(results[0], {header: true, skipEmptyLines: true});
            const parsePredCsv = Papa.parse(results[1], {header: true, skipEmptyLines: true});

            // Assume there's a csvToGeoJSON function to convert true CSV to GeoJSON
            csvToGeoJSON('./data/lots_1687.csv', (error, geojsonData) => {
                if (error) {
                    console.error('Error converting CSV to GeoJSON:', error);
                    return;
                }

                // Update geojsonData with properties from true.csv and pred.csv
                geojsonData.features.forEach((feature, index) => {
                    // Assign the number of lots from true.csv
                    feature.properties.n_lots = Number(parseTrueCsv.data[index]['11:45']);
                    feature.properties.true_n_lots = []; // Initialize with true data
                    feature.properties.pred_n_lots = []; // Initialize with predicted data

                    // Loop over each time point, assuming you have 48 time points (00:00 to 11:45 every 15 minutes)
                    for (let i = 0; i < 48; i++) {
                        let hour = Math.floor(i / 4);
                        let minute = (i % 4) * 15;
                        let timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                        // Append true and predicted data points to their respective arrays
                        feature.properties.true_n_lots.push(Number(parseTrueCsv.data[index][timeKey]));
                        // Handle pred.csv data differently since it's a prediction
                        if (i >= 24) {
                            feature.properties.pred_n_lots.push(Number(parsePredCsv.data[index][timeKey]));
                        } else {
                            feature.properties.pred_n_lots.push(null)
                        }
                    }
                });

                console.log(geojsonData);

                // Add the updated geojsonData as a source to the map...
                // Add a data source
                map.addSource('lots', {
                    type: 'geojson',
                    data: geojsonData
                });

                // Add your layers and other Mapbox logic here
                map.addLayer({
                    id: 'lots_1687',
                    type: 'circle',
                    source: 'lots',
                    paint: {
                        // Use opacity to indicate availability - more available = less opacity
                        'circle-opacity': [
                            'interpolate',
                            ['linear'],
                            ['get', 'n_lots'],
                            0, 0.9, // 0 available spaces - more opaque
                            600, 0.2 // 600 available spaces - less opaque
                        ],
                        'circle-color': 'rgb(30,144,255)', // Dodger blue color
                        'circle-stroke-color': 'white',    // White stroke to improve visibility
                        'circle-stroke-width': 1,
                        'circle-radius': 5,
                    },
                });
            });
        })
        .catch(error => {
            console.error('Error fetching CSV files:', error);
        });

}

// Function to generate HTML content for the popup, including a Chart.js chart
function generatePopupContent(lnglat) {
    // Create a unique ID for the canvas
    const uniqueCanvasId = 'chart-' + Math.random().toString(36).substr(2, 9);
    // Store the clicked data for use when the popup is open
    window.currentPopupData = {
        id: uniqueCanvasId,
    };

    getNearbyPlaces(lnglat)
    // Return the HTML for the popup with the unique canvas ID
    return `
        <div style="width:1200px; max-width:100%;">
            <canvas id="${uniqueCanvasId}" style="width:100%; height:200px;"></canvas>
        </div>
        <p align="center">
                <strong>coordinate (${lnglat.lng.toFixed(3)}&deg;E, ${lnglat.lat.toFixed(3)}&deg;N)</strong>
            <u id="placesList" style="margin-left: 30px">Popular POIs</u>
        </p>
        `;
}

function getNearbyPlaces(lnglat) {
    var mapboxAccessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg'; // 替换为你的Mapbox Access Token
    var types = 'poi'; // 指定你想搜索的类型为兴趣点（POI）
    var limit = 3; // 限制返回结果数量
    var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lnglat.lng},${lnglat.lat}.json?` +
        `access_token=${mapboxAccessToken}&limit=${limit}&types=${types}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features && Array.isArray(data.features)) {
                var places = data.features.map(feature => feature.text).slice(0, 3);
                updatePopupContent(places);
            } else {
                console.error('Received data is not an array:', data);
            }
        })
        .catch(error => console.error('Error:', error));
}

function updatePopupContent(places) {
    if (Array.isArray(places)) {
        document.querySelector('#placesList').innerHTML = places.join(', ');
    } else {
        console.error('places is not an array:', places);
    }
}


// Function to generate time labels for a 12-hour period every 15 minutes
function generateTimeLabels() {
    const labels = [];
    for (let hour = 0; hour < 12; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            labels.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }
    return labels;
}

// Function to initialize the Chart.js chart, called after the popup is shown
// Reference: https://www.chartjs.org/docs/latest/
function initChart(canvasId, trueData, predData) {
    trueArr = trueData.slice(1, -1).split(',').map(Number)
    predArr = predData.slice(1, -1).split(',').map(Number)

    new Chart(
        document.getElementById(canvasId),
        {
            type: 'line',
            data: {
                labels: generateTimeLabels(),
                datasets: [{
                    label: 'True',
                    data: trueArr,
                    borderColor: 'red',
                    fill: false
                }, {
                    label: 'Predicted',
                    data: predArr,
                    borderColor: 'blue',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    },
                    y: {
                        beginAtZero: true, // 根据你的数据可能需要调整
                        ticks: {
                            // 你可能需要自定义 tick 配置
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            line6AM: { // 注解的ID
                                type: 'line',
                                mode: 'vertical',
                                xMin: '06:00',
                                xMax: '06:00',
                                borderColor: 'black',
                                borderWidth: 2,
                                borderDash: [6, 6], // 这会创建一个6px的虚线和6px的间隙
                                label: {
                                    enabled: true,
                                    content: '6:00 AM',
                                    position: "start"
                                }
                            }
                        }
                    }
                }
            }
        }
    );
}
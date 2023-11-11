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

// 添加站点数据图层
function addStationsLayer() {
    // Prepare the fetch requests for both CSV files
    const fetchTrueCsv = fetch('./data/true.csv').then(response => response.text());
    const fetchPredCsv = fetch('./data/pred.csv').then(response => response.text());

    // Use Promise.all to handle both fetch requests
    Promise.all([fetchTrueCsv, fetchPredCsv])
        .then(results => {
            // results[0] will be the response from true.csv
            // results[1] will be the response from pred.csv
            // Now you can parse both CSV files
            const parseTrueCsv = Papa.parse(results[0], {header: true, skipEmptyLines: true});
            const parsePredCsv = Papa.parse(results[1], {header: true, skipEmptyLines: true});

            // Since Papa.parse is synchronous if no callback is provided, we can continue immediately
            // We'll assume there's a csvToGeoJSON function to convert our true CSV to GeoJSON
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
                        // For pred.csv, you might need to handle the data differently since it's a prediction
                        if (i < 24) {
                            feature.properties.pred_n_lots.push(Number(parsePredCsv.data[index][timeKey]));
                        }
                    }
                });

                console.log(geojsonData);

                // Add the updated geojsonData as a source to the map...
                // 添加数据源
                map.addSource('lots', {
                    type: 'geojson',
                    data: geojsonData
                });

                // 在这里添加你的图层和其他mapbox逻辑
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
                        // Use size variation - more available = larger circle
                        // 'circle-radius': [
                        //     'interpolate',
                        //     ['linear'],
                        //     ['get', 'n_lots'],
                        //     0, 5,    // 0 available spaces - smaller circle
                        //     600, 12  // 600 available spaces - larger circle
                        // ],
                        // Color remains consistent, but you can choose one that suits the map style
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

// This function generates the HTML content for the popup, including a Chart.js chart
function generatePopupContent(clickedData) {
    // Create a unique ID for the canvas
    const uniqueCanvasId = 'chart-' + Math.random().toString(36).substr(2, 9);
    // Store the clicked data so we can use it when the popup is open
    window.currentPopupData = {
        id: uniqueCanvasId,
    };

    // Return the HTML for the popup with the unique canvas ID
    return '<canvas id="' + uniqueCanvasId + '" width="400" height="200"></canvas>';
}

// JavaScript function to generate time labels for a 12-hour period every 15 minutes
function generateTimeLabels() {
    const labels = [];
    for (let hour = 0; hour < 12; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            labels.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }
    return labels;
}

// This function initializes the Chart.js chart, to be called after the popup is shown
function initChart(canvasId, trueData, predData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(),
            datasets: [{
                label: 'True',
                data: trueData,
                borderColor: 'red',
                fill: false
            }, {
                label: 'Predicted',
                data: predData,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'HH:mm',
                        displayFormats: {
                            quarter: 'HH:mm'
                        }
                    }
                }]
            }
        }
    });
}
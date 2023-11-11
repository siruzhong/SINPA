// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';

// Create the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the map container
    style: 'mapbox://styles/mapbox/streets-v11', // URL to the map style
    center: [103.8198, 1.3521], // Initial position [lng, lat]
    zoom: 12,
    projection: 'mercator' // Initial projection
});

// When the map finishes loading, add the stations layer
map.on('load', function () {
    addStationsLayer();
});

// Create a popup instance
var popup = new mapboxgl.Popup({
    closeOnClick: false,
    closeButton: false,
});

// When a parking site is hovered over
map.on('mouseenter', 'lots_1687', function (e) {
    const clickedData = e.features[0].properties;

    // Create the popup content and get the canvas ID
    const content = generatePopupContent(clickedData);
    const uniqueCanvasId = window.currentPopupData.id;

    // Create the popup
    popup.setLngLat(e.lngLat)
        .setHTML(content);

    // Set the cursor to a pointer
    map.getCanvas().style.cursor = 'pointer';

    // Attach an 'open' event listener to the popup
    popup.on('open', function () {
        // Ensure the popup content has been rendered
        requestAnimationFrame(function () {
            // Initialize the chart
            initChart(uniqueCanvasId, clickedData.true_n_lots, clickedData.pred_n_lots);
        });
    });

    // Add the popup to the map
    popup.addTo(map);
});

// Event handler for mouseleave on 'lots_1687' layer
map.on('mouseleave', 'lots_1687', function () {
    // Reset cursor style
    map.getCanvas().style.cursor = '';

    // Remove the popup
    popup.remove();
});
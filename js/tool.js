// Define a coordinates geocoder function
const coordinatesGeocoder = function (query) {
    // Match any input that looks like decimal coordinate pairs
    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    // Build coordinate features
    function coordinateFeature(lng, lat) {
        return {
            center: [lng, lat],
            geometry: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature'
        };
    }

    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        // It should be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // It should be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // Otherwise, it could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
};

// Add a location search box to the map
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        zoom: 4,
        placeholder: 'Search here ...',
        mapboxgl: mapboxgl,
        reverseGeocode: true
    })
);

// Define an Air Quality Legend control
class ParkingAvailabilityLegendControl {
    onAdd(map) {
        this.map = map;
        this.container = document.getElementById('parkingAvailabilityLegend');
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

// Add the Air Quality Legend control to the bottom-right corner of the map
map.addControl(new ParkingAvailabilityLegendControl(), 'bottom-right');

// Add zoom and rotate controls to the map
map.addControl(new mapboxgl.NavigationControl());

// Add a scale control to the map
map.addControl(new mapboxgl.ScaleControl());
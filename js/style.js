// Get all style switch links with data-style attribute
const styleLinks = document.querySelectorAll('.submenu__item a[data-style]');

// Add a click event listener for each link
for (const link of styleLinks) {
    link.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent the default link click behavior
        const styleId = this.getAttribute('data-style');
        map.setStyle('mapbox://styles/mapbox/' + styleId);

        // Add an event listener to wait for the new style to load and then add the stations layer
        map.once('style.load', addStationsLayer);
    });
}
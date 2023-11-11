// 设置Mapbox的访问令牌
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';

// 创建地图
const map = new mapboxgl.Map({
    container: 'map', // 地图容器的ID
    style: 'mapbox://styles/siruzhong/clmr3ruds027p01pj91ajfoif/draft', // 地图样式的URL
    center: [103.8198, 1.3521], // 初始位置 [经度, 纬度]
    zoom: 12, // 初始缩放级别
    projection: 'mercator' // 初始投影方式
});

// 当地图加载完成时执行
map.on('load', function () {
    addStationsLayer(); // 添加站点数据层
});

// 创建弹出窗口
var popup = new mapboxgl.Popup({
    closeOnClick: false,
    closeButton: false,
});

// 当鼠标悬停在站点上时显示数据
map.on('mouseenter', 'lots_1687', function (e) {
    const clickedData = e.features[0].properties;

    popup.setLngLat(e.lngLat)
        .setHTML(generatePopupContent(clickedData))
        .addTo(map);

    map.getCanvas().style.cursor = 'pointer';
});

// Event listener for when the popup is added to the map
map.on('popupopen', function () {
    // Use a timeout to allow the popup's content to be added to the DOM
    setTimeout(function () {
        // Retrieve the stored data using the unique canvas ID
        const popupData = window.currentPopupData;
        if (popupData) {
            initChart(popupData);
        }
    }, 10); // The timeout may need to be adjusted depending on the performance
});

// 当鼠标离开站点时移除数据
map.on('mouseleave', 'lots_1687', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});


// 设置Mapbox的访问令牌
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';

// 创建地图
const map = new mapboxgl.Map({
    container: 'map', // 地图容器的ID
    style: 'mapbox://styles/siruzhong/clmr3ruds027p01pj91ajfoif/draft', // 地图样式的URL
    center: [116.173553, 40.09068], // 初始位置 [经度, 纬度]
    zoom: 6, // 初始缩放级别
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
map.on('mouseenter', '1085-stations-1cyyg4', function (e) {
    const clickedData = e.features[0].properties;

    popup.setLngLat(e.lngLat)
        .setHTML(generatePopupContent(clickedData))
        .addTo(map);

    map.getCanvas().style.cursor = 'pointer';
});

// 当鼠标离开站点时移除数据
map.on('mouseleave', '1085-stations-1cyyg4', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

// 添加点击事件监听器
map.on('click', function (e) {
    if (isClickEnabled) {
        // 获取点击的经纬度
        var lngLat = e.lngLat;

        // 检查点击的经纬度是否在指定的范围内
        if (isWithinBounds(lngLat)) {
            // 使用经纬度查询数据
            fetchDataForLocation(lngLat, function (data) {
                // 创建一个信息窗口
                new mapboxgl.Popup()
                    .setLngLat(lngLat)
                    .setHTML(generatePopupContent(data))
                    .addTo(map);
            });
        }
    }
});



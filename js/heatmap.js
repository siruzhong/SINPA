// 定义经纬度范围
const latRange = [53.714166, 18.424216];
const lngRange = [73.683851, 135.383069];

// 初始化格网大小和格网数据数组
let gridSize = 1;
const gridData = [];

// 添加格网数据
function addGridData() {
    for (let lat = latRange[1]; lat <= latRange[0]; lat += gridSize) {
        for (let lng = lngRange[0]; lng <= lngRange[1]; lng += gridSize) {
            const pm25Value = Math.random() * 300;
            gridData.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [lng, lat],
                            [lng + gridSize, lat],
                            [lng + gridSize, lat - gridSize],
                            [lng, lat - gridSize],
                            [lng, lat]
                        ]
                    ]
                },
                properties: {
                    pm25: pm25Value
                }
            });
        }
    }
}

// 创建 GeoJSON 数据源
function createGeoJSONSource() {
    map.addSource('pm25', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: gridData
        }
    });
}

// 添加 Heatmap 图层
function addHeatmapLayer() {
    addGridData(); // 添加格网数据
    createGeoJSONSource(); // 创建 GeoJSON 数据源
    map.addLayer({
        id: 'pm25-fill',
        type: 'fill',
        source: 'pm25',
        paint: {
            'fill-color': [
                'interpolate', ['linear'], ['get', 'pm25'],
                0, 'rgba(0, 255, 0, 0.7)',
                50, 'rgba(255, 255, 0, 0.7)',
                100, 'rgba(255, 165, 0, 0.8)',
                150, 'rgba(255, 69, 0, 0.9)',
                200, 'rgba(255, 0, 0, 1)',
                300, 'rgba(139, 0, 0, 1)'
            ],
            'fill-opacity': 0.7
        },
        layout: {
            'visibility': 'none'  // 初始设置为不可见
        }
    });
}

// 更新数据和图层
function updateDataAndLayer() {
    gridData.length = 0; // 清空旧数据
    addGridData(); // 添加新数据
    map.getSource('pm25').setData({ // 更新数据源
        type: 'FeatureCollection',
        features: gridData
    });
}

// 点击切换 heatmap 可见性按钮时的事件监听器
document.getElementById('heatmapToggle').addEventListener('click', function () {
    const currentVisibility = map.getLayoutProperty('pm25-fill', 'visibility');
    if (currentVisibility === 'visible') {
        map.setLayoutProperty('pm25-fill', 'visibility', 'none');
        map.setLayoutProperty('1085-stations-1cyyg4', 'visibility', 'visible');
    } else {
        map.setLayoutProperty('pm25-fill', 'visibility', 'visible');
        map.setLayoutProperty('1085-stations-1cyyg4', 'visibility', 'none');
    }
});

// 初始化时创建数据源和图层
map.on('load', function () {
    addHeatmapLayer();
});

// 点击不同尺度的 heatmap 按钮时，更新数据和图层
document.getElementById('heatmap1km').addEventListener('click', function () {
    gridSize = 1;
    updateDataAndLayer();
});

document.getElementById('heatmap2km').addEventListener('click', function () {
    gridSize = 2;
    updateDataAndLayer();
});

document.getElementById('heatmap3km').addEventListener('click', function () {
    gridSize = 3;
    updateDataAndLayer();
});
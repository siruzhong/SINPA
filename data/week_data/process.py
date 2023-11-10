import json

import numpy as np

data = np.load('week_data.npy')

stations = []
# Assuming data.shape is (time_slices, num_stations, num_features)
for j in range(data.shape[1]):  # Loop over stations
    station_data = {
        'air': {
            'PM2.5': data[:, j, 0].tolist(),
            'PM10': data[:, j, 1].tolist(),
            'NO2': data[:, j, 2].tolist(),
            'CO': data[:, j, 3].tolist(),
            'O3': data[:, j, 4].tolist(),
            'SO2': data[:, j, 5].tolist()
        },
        'tmp': {
            'Rainfall': data[:, j, 6].tolist(),
            'Temperature': data[:, j, 7].tolist(),
            'Pressure': data[:, j, 8].tolist(),
            'Humidity': data[:, j, 9].tolist(),
            'Wind Speed': data[:, j, 10].tolist(),
            'Wind Direction': data[:, j, 11].tolist(),
            'Weather': data[:, j, 12].tolist()
        },
        'time': {
            'Time of Day': data[:, j, 13].tolist(),
            'Day of Week': data[:, j, 14].tolist(),
        }
    }
    stations.append(station_data)

with open('week_data.json', 'w') as json_file:
    json.dump(stations, json_file, indent=4)

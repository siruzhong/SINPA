import numpy as np

# 指定要提取的时间刻度索引，例如提取第0个时间刻度
time_index = 12

# 加载包含三个维度的数据文件
week_data = np.load('../week_data/week_data.npy')

# 提取指定时刻的数据，仅保留后两个维度
hour_data = week_data[time_index, :, :]

# 保存提取的数据为新的 .npy 文件
np.save('hour_data.npy', hour_data)

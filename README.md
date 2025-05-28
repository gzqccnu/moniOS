# moniOS

这是一个基于 Web 的操作系统监控面板，提供了类似于 ps -ef、htop、iftop 和 osquery 的功能，使您能够通过浏览器查看和分析Linux系统性能。

## 功能特点

- **系统概览**: 显示操作系统信息、资源使用情况和网络信息
- **进程监控**: 类似于htop的进程监控器，可以查看和搜索系统进
- **进程视图**  提供更多的进程与资源信息和可视化
- **系统查询**: 基于osquery的SQL查询接口，可以通过SQL语句查询系统信息
- **用户账户**: 显示系统用户账户信息
- **网络流量监控**: 可以实时查看更详细的网络流量信息

## 系统要求

- Python 3.8+
- Linux操作系统（推荐Ubuntu/Debian）
- 必需：osquery工具

## 安装步骤

1. 克隆或下载此仓库到您的Linux服务器

2. 安装依赖:

```bash
pip install -r requirements.txt
```

3. 安装系统工具:

```bash
# 安装perf工具
sudo apt-get update
sudo apt-get install linux-tools-common linux-tools-generic

# 安装osquery
# 请访问 https://osquery.io/downloads 获取适合您系统的安装包和说明
```

## 使用方法

1. 启动服务器：

```bash
python app.py
```

2. 在浏览器中访问：

```
http://localhost:6789
```

## 特别说明

- 如果不能安装osquery，系统将使用模拟数据
- 网络使用数据会保存在网络历史文件中，以提供趋势分析

## 开发者信息

如需扩展功能，可修改以下文件：

- `utils/` 目录下的各模块实现了不同的数据采集功能
- `utils/css` 目录下是对应模块的 css 代码
- `utils/js` ，目录下是对应模块的 js 代码
- `app.py` 实现了Flask后端API
- `static/js/api_client.js` 实现了前端与API的通信
- `dashboard_os_info.html` 是前端界面

## 安全注意事项

- 此应用默认监听在所有网络接口上，如果部署在生产环境，请添加适当的认证和防火墙规则
- osquery功能已经实现了SQL注入防护，但建议仍然只在安全环境中使用 

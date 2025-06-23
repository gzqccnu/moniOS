# moniOS

一个基于 Web 的操作系统监控面板，提供类似 `uname -a`、`ps -ef`、`htop`、`iftop` 和 `osquery` 的功能，能够通过浏览器查看和分析 Linux 系统状态。

## 功能

* **系统概览**：显示操作系统信息、资源使用情况和网络详情
* **进程监控**：类 htop 的进程监控，可查看并搜索系统进程
* **进程视图**：提供进程/资源的详细信息和可视化
* **系统查询**：基于 osquery 的 SQL 查询接口，用于检索系统信息
* **用户账户**：显示系统用户账户信息
* **网络流量监控**：实时详细的网络流量可视化

## 系统要求

* **Python 3.8+**
* **Linux 操作系统（Ubuntu/Debian 推荐）**
* **必需**：`osquery`、`htop`、`iftop`

## 安装步骤

将此仓库克隆或下载到您的 Linux 服务器：

```bash
git clone https://github.com/gzqccnu/moniOS.git
cd moniOS
# 安装 Python 依赖：
pip install -r requirements.txt
# 安装系统工具：
# 访问 https://osquery.io/downloads 获取针对操作系统的安装包和说明
````

> **使用方法**
> 启动服务器：
> `python app.py`
> 在浏览器中访问：
> `http://localhost:6789`
# 安装系统工具：
# 访问 https://osquery.io/downloads 获取操作系统特定的安装包和说明
```

> \[!IMPORTANT]
> 启动服务器时请使用 `sudo` 提升权限，否则无法使用网络流量监控功能

> \[!NOTE]
> 如果无法通过 `pip install -r requirements.txt` 安装所需 Python 包，可改为单独安装对应的包，例如：
>
> ```bash
> pip install flask psutil osquery
> ```

> \[!TIP]
> **网络使用数据** 将存储在历史文件中，以便进行趋势分析；同时可确保成功获取网络数据。
> 原始代码中的 SQL 查询仅能执行 `SELECT` 以及 osquery 的特殊命令（如 `.tables`），无法执行其他 SQL。如需移除限制，可在 **/utils/osquery-handler.py** 中进行修改。

## 开发者信息

* [gzqccnu](https://github.com/gzqccnu)
* 联系方式：[gzqccnu@gmail.com](mailto:gzqccnu@gmail.com)

要扩展功能，请修改以下文件：

* **utils/** 目录下的模块：实现各种数据收集功能
* **utils/css/**：模块专用 CSS
* **utils/js/**：模块专用 JavaScript
* **app.py**：Flask 后端 API
* **static/js/api\_client.js**：前端与 API 的通信
* **dashboard\_os\_info.html**：前端界面（可在其中添加新的导航栏）

## 依赖

*[**osquery**](https://github.com/osquery/osquery)（双许可证：Apache-2.0/GPL-2.0-only）*
许可证：**[https://osquery.io/license](https://osquery.io/license)**
本项目集成使用 **Apache-2.0 许可证**

## 安全考虑

* 应用默认监听所有网络接口。生产部署时请实施身份验证和防火墙规则
* osquery 功能已做 SQL 注入防护，但仍建议仅在安全环境中使用

# moniOS

A web-based operating system monitoring panel that provides functionality similar to `ps -ef`, `htop`, `iftop`, and `osquery`, 
enabling you to view and analyze Linux system status through a browser.

## Features
- **System Overview**: Displays operating system information, resource usage, and network details

- **Process Monitoring**: htop-like process monitor to view and search system processes

- **Process View**: Provides detailed process/resource information and visualizations

- **System Query**: SQL-based query interface using osquery to retrieve system information

- **User Accounts**: Shows system user account information

- **Network Traffic Monitoring**: Real-time detailed network traffic visualization

## System Requirements
- **Python 3.8+**

- **Linux OS (Ubuntu/Debian recommended)**

- **Required**: `osquery tool`

## Installation Steps
Clone or download this repository to your Linux server:

```bash
git clone https://github.com/gzccnu/moniOS.git
# Install Python dependencies:
pip install -r requirements.txt
# Install system tools:
# Visit https://osquery.io/downloads for OS-specific packages and instructions
```
> Usage
> Start the server:
> `python app.py`
> Access via browser:
> `http://localhost:6789`

## Special Notes
> If osquery cannot be installed, simulated data will be used <br>
> Network usage data is stored in history files for trend analysis

## Developer Information
- [gzccnu] https://github.com/gzqccnu
- Contact: gzqccnu@gmail.com
<br>
To extend functionality, modify these files:

- Modules in **utils/** implement various data collection functions

- Module-specific CSS in **utils/css/**

- Module-specific JavaScript in **utils/js/**

- **app.py** contains the Flask backend API

- **static/js/api_client.js** handles frontend-API communication

- **dashboard_os_info.html** is the frontend interface

## Dependencies
***osquery** (dual-licensed under Apache-2.0/GPL-2.0-only)*
*License: **https://osquery.io/license***
<br>
*This project integrates using the **Apache-2.0 license***

## Security Considerations
- The application listens on all network interfaces by default. For production deployments, implement authentication and firewall rules

- SQL injection protection measures are implemented for osquery functions, but usage should still be restricted to secure environments

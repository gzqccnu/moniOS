#!/bin/bash
# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

# 检查Python版本
python_version=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "错误: Python版本需要 $required_version 或更高，当前版本: $python_version"
    exit 1
fi

# 检查是否已安装必要的依赖
pip_check() {
    python3 -c "import $1" 2>/dev/null
    return $?
}

echo "检查依赖..."
missing_deps=()

for pkg in flask flask_cors psutil netifaces; do
    if ! pip_check $pkg; then
        missing_deps+=($pkg)
    fi
done

if [ ${#missing_deps[@]} -ne 0 ]; then
    echo "缺少依赖: ${missing_deps[*]}"
    echo "安装依赖中..."
    pip3 install -r requirements.txt
fi

# 检查是否安装了perf
if ! command -v perf &> /dev/null; then
    echo "警告: 未检测到perf工具，性能分析功能将使用模拟数据"
    echo "可以通过以下命令安装perf工具:"
    echo "  sudo apt-get update && sudo apt-get install linux-tools-common linux-tools-generic"
fi

# 检查是否安装了osquery
if ! command -v osqueryi &> /dev/null; then
    echo "警告: 未检测到osquery工具，osquery功能将使用模拟数据"
    echo "可以访问 https://osquery.io/downloads 获取安装指南"
fi

# 检查是否为root用户运行
if [ "$EUID" -ne 0 ]; then
    echo "警告: 非root用户运行，某些功能（如perf）可能受限"
    echo "建议使用 sudo ./start.sh 以获得完整功能"
    read -p "是否继续以非root用户运行? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "退出..."
        exit 1
    fi
fi

# 启动应用
echo "启动操作系统监控面板..."
python3 app.py

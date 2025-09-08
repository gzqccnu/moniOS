# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import psutil
import platform
import socket
import os
import subprocess
import datetime
import time
from pathlib import Path

def get_cpu_info_windows():
    """获取Windows系统CPU信息的多种方法"""
    try:
        # 方法1: 使用wmic命令
        output = subprocess.check_output("wmic cpu get name", shell=True).decode('utf-8', errors='ignore')
        lines = output.strip().split('\n')
        if len(lines) > 1:
            return lines[1].strip()
    except:
        pass

    try:
        # 方法2: 使用PowerShell命令
        output = subprocess.check_output(
            "powershell -command \"Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty Name\"",
            shell=True).decode('utf-8', errors='ignore')
        return output.strip()
    except:
        pass

    # 方法3: 使用Python的platform模块
    processor = platform.processor()
    if processor and processor != "":
        return processor

    # 方法4: 使用更详细的系统信息
    sys_info = platform.uname()
    if hasattr(sys_info, 'processor') and sys_info.processor:
        return sys_info.processor

    # 备选值
    return f"处理器 ({platform.machine()})"

def get_system_info():
    """获取系统基本信息"""
    try:
        # 获取CPU信息
        cpu_info = ""

        # 方法1: 尝试使用lshw命令获取CPU信息(对Kunpeng处理器更有效)
        try:
            # 使用-class processor指定只获取处理器信息
            output = subprocess.check_output("lshw -class processor 2>/dev/null", shell=True).decode('utf-8', errors='ignore')

            # 解析输出寻找CPU信息，优先检查version字段中是否包含Kunpeng
            for line in output.splitlines():
                line = line.strip()
                if line.startswith("version:") and "Kunpeng" in line:
                    cpu_info = line.split(":", 1)[1].strip()
                    break
                elif line.startswith("version:") and not cpu_info:
                    cpu_info = line.split(":", 1)[1].strip()
                elif line.startswith("product:") and not cpu_info:
                    cpu_info = line.split(":", 1)[1].strip()
                # 如果没有找到product或version字段，也可能是这些字段存储了CPU信息
                elif "Kunpeng" in line and not cpu_info:
                    cpu_info = line
                elif line.startswith("cpu:") or line.startswith("model:"):
                    if not cpu_info:  # 只在尚未找到时设置
                        cpu_info = line.split(":", 1)[1].strip()
        except Exception as e:
            print(f"lshw命令获取CPU信息失败: {e}")

        # 方法2: 如果lshw没有结果，尝试dmidecode命令
        if not cpu_info:
            try:
                output = subprocess.check_output("dmidecode -t processor 2>/dev/null", shell=True).decode('utf-8', errors='ignore')
                for line in output.splitlines():
                    line = line.strip()
                    if line.startswith("Version:") or line.startswith("Family:") or line.startswith("Product Name:"):
                        cpu_info = line.split(":", 1)[1].strip()
                        if "Kunpeng" in cpu_info:
                            break
            except Exception as e:
                print(f"dmidecode命令获取CPU信息失败: {e}")

        # 方法3: 解析/proc/cpuinfo文件
        if not cpu_info and os.path.exists('/proc/cpuinfo'):
            try:
                with open('/proc/cpuinfo', 'r') as f:
                    cpuinfo_content = f.read()

                # 针对ARM处理器检查特定字段
                for line in cpuinfo_content.splitlines():
                    if 'Hardware' in line and cpu_info == "":
                        cpu_info = line.split(':')[1].strip()
                        break
                    elif 'Processor' in line and cpu_info == "":
                        cpu_info = line.split(':')[1].strip()
                    elif 'model name' in line and cpu_info == "":
                        cpu_info = line.split(':')[1].strip()
                    elif 'cpu model' in line and cpu_info == "":
                        cpu_info = line.split(':')[1].strip()
            except Exception as e:
                print(f"读取/proc/cpuinfo出错: {e}")

        # 方法4: 查看设备树模型文件 (适用于某些ARM系统)
        if not cpu_info:
            try:
                paths = [
                    "/sys/firmware/devicetree/base/model",
                    "/sys/devices/virtual/dmi/id/product_name",
                    "/sys/class/dmi/id/product_name"
                ]
                for path in paths:
                    if os.path.exists(path):
                        with open(path, 'r') as f:
                            content = f.read().strip()
                        if content:
                            cpu_info = content
                            break
            except Exception as e:
                print(f"读取系统模型文件失败: {e}")

        # 方法5: 最后使用platform模块
        if not cpu_info:
            cpu_info = platform.processor()

        # 确保有默认值
        if not cpu_info or cpu_info.strip() == "":
            machine = platform.machine()
            if "aarch64" in machine.lower():
                cpu_info = f"ARM64处理器 ({machine})"
            else:
                cpu_info = f"未知处理器 ({machine})"

        # 获取内核版本
        kernel_version = platform.release()

        # 获取操作系统信息
        if os.path.exists('/etc/os-release'):
            os_info = {}
            with open('/etc/os-release', 'r') as f:
                for line in f:
                    if '=' in line:
                        key, value = line.split('=', 1)
                        os_info[key] = value.strip().strip('"')
            os_name = os_info.get('PRETTY_NAME', platform.system())
        else:
            os_name = platform.system() + " " + platform.version()

        # 获取系统启动时间
        boot_time = psutil.boot_time()
        uptime = datetime.datetime.now() - datetime.datetime.fromtimestamp(boot_time)
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        uptime_str = f"{days}天 {hours}小时 {minutes}分钟"

        return {
            'hostname': socket.gethostname(),
            'osName': os_name,
            'osVersion': kernel_version,
            'computerName': socket.gethostname(),
            'cpuArch': platform.machine(),
            'cpuModel': cpu_info,
            'cpuCores': f"{psutil.cpu_count(logical=False) or 1} ({psutil.cpu_count(logical=True)} 逻辑)",
            'uptime': uptime_str
        }
    except Exception as e:
        print(f"获取系统信息时出错: {e}")
        return {
            'hostname': '未知',
            'osName': '未知',
            'osVersion': '未知',
            'computerName': '未知',
            'cpuArch': '未知',
            'cpuModel': '未知',
            'cpuCores': '未知',
            'uptime': '未知'
        }

def get_resource_usage():
    """获取资源使用情况"""
    try:
        # 采用更精确的CPU使用率测量方法
        # 首先获取每个CPU核心的使用率
        per_cpu_percent = psutil.cpu_percent(interval=0.5, percpu=True)
        # 计算所有核心的平均值
        cpu_percent = sum(per_cpu_percent) / len(per_cpu_percent) if per_cpu_percent else 0

        # 为了防止瞬时波动，可以与系统负载做比较
        # 如果系统负载表明CPU处于活跃状态但测量值异常低，则进行调整
        if hasattr(os, 'getloadavg'):
            load_avg = os.getloadavg()[0]  # 1分钟平均负载
            cpu_count = psutil.cpu_count(logical=True)
            # 计算负载平均值相对于CPU核心数的百分比
            load_percent = (load_avg / cpu_count) * 100 if cpu_count else 0

            # 如果负载百分比明显高于CPU百分比，取两者的平均值
            if load_percent > cpu_percent * 1.5:
                cpu_percent = (cpu_percent + load_percent) / 2

        # 确保值在合理范围内
        cpu_percent = min(100.0, max(0.0, cpu_percent))

        # 内存使用情况
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        total_memory = f"{memory.total / (1024**3):.2f}GB"
        free_memory = f"{memory.available / (1024**3):.2f}GB"

        # 磁盘使用情况
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        total_disk = f"{disk.total / (1024**3):.2f}GB"
        free_disk = f"{disk.free / (1024**3):.2f}GB"

        return {
            'cpuUsage': round(cpu_percent, 1),
            'memoryUsage': round(memory_percent, 1),
            'diskUsage': round(disk_percent, 1),
            'totalMemory': total_memory,
            'freeMemory': free_memory,
            'totalDisk': total_disk,
            'freeDisk': free_disk
        }
    except Exception as e:
        print(f"获取资源使用情况时出错: {e}")
        return {
            'cpuUsage': 0,
            'memoryUsage': 0,
            'diskUsage': 0,
            'totalMemory': '未知',
            'freeMemory': '未知',
            'totalDisk': '未知',
            'freeDisk': '未知'
        }

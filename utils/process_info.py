# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import psutil
import subprocess
import time
import datetime
import os
from collections import defaultdict

def get_processes(limit=50):
    """获取进程列表信息"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'create_time', 'status']):
        try:
            pinfo = proc.info
            # 格式化创建时间
            create_time = datetime.datetime.fromtimestamp(pinfo['create_time']).strftime("%m-%d %H:%M")
            # 获取状态码并转换为对应的字符
            status_map = {
                psutil.STATUS_RUNNING: 'R',
                psutil.STATUS_SLEEPING: 'S',
                psutil.STATUS_DISK_SLEEP: 'D',
                psutil.STATUS_STOPPED: 'T',
                psutil.STATUS_TRACING_STOP: 'T',
                psutil.STATUS_ZOMBIE: 'Z',
                psutil.STATUS_DEAD: 'X',
                psutil.STATUS_WAKING: 'W',
                psutil.STATUS_IDLE: 'I',
                psutil.STATUS_LOCKED: 'L',
                psutil.STATUS_WAITING: 'W'
            }
            status = status_map.get(pinfo['status'], '?')

            processes.append({
                'pid': pinfo['pid'],
                'name': pinfo['name'],
                'user': pinfo['username'] or 'unknown',
                'cpu': round(pinfo['cpu_percent'] or 0, 1),
                'memory': round(pinfo['memory_percent'] or 0, 1),
                'startTime': create_time,
                'state': status
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    # 按CPU使用率排序，并限制返回数量
    processes.sort(key=lambda x: x['cpu'], reverse=True)
    return processes[:limit]

def get_htop_data():
    """获取类似htop的进程详细信息"""
    try:
        # 获取系统整体信息
        load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else (0, 0, 0)
        load_avg_str = f"{load_avg[0]:.2f} {load_avg[1]:.2f} {load_avg[2]:.2f}"

        # 获取CPU使用率 - 使用更长的间隔以获得更稳定的结果
        cpu_times_percent = psutil.cpu_times_percent(interval=1.0)
        cpu_user = cpu_times_percent.user
        cpu_system = cpu_times_percent.system
        cpu_idle = cpu_times_percent.idle
        # 获取中断时间百分比(如果available)
        cpu_irq = getattr(cpu_times_percent, 'irq', 0) + getattr(cpu_times_percent, 'softirq', 0)

        # 获取内存信息
        memory = psutil.virtual_memory()
        mem_used = f"{memory.used / (1024**3):.2f}GB"
        mem_free = f"{memory.available / (1024**3):.2f}GB"
        mem_buff = f"{getattr(memory, 'buffers', 0) / (1024**3):.2f}GB"

        # 获取交换分区信息
        swap = psutil.swap_memory()
        swap_used = f"{swap.used / (1024**3):.2f}GB"
        swap_free = f"{swap.free / (1024**3):.2f}GB"

        # 获取进程数和正在运行的进程数
        all_processes = list(psutil.process_iter(['status', 'num_threads']))
        process_count = len(all_processes)

        # 更准确地计算运行中的进程和线程总数
        running_count = 0
        thread_count = 0

        for proc in all_processes:
            try:
                # 累计线程数
                thread_count += proc.info['num_threads']

                # 检查进程是否正在运行
                if proc.info['status'] == psutil.STATUS_RUNNING:
                    running_count += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # 如果运行中进程数为0但系统明显在工作，设置一个最小值
        if running_count == 0 and load_avg[0] > 0.3:
            running_count = max(1, int(load_avg[0] * 2))

        # 获取系统启动时间
        boot_time = psutil.boot_time()
        uptime = datetime.datetime.now() - datetime.datetime.fromtimestamp(boot_time)
        uptime_str = f"{uptime.days}天 {uptime.seconds // 3600:02d}:{(uptime.seconds % 3600) // 60:02d}:{uptime.seconds % 60:02d}"

        # 获取详细进程信息 - 使用预排序过滤掉不重要的进程
        processes = []
        # 首先收集所有进程的基本CPU使用情况
        all_procs_cpu = {}

        # 预热CPU使用率统计
        for _ in range(2):
            for p in psutil.process_iter(['pid']):
                try:
                    p.cpu_percent()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            time.sleep(0.1)

        # 获取实际CPU使用率
        for p in psutil.process_iter(['pid']):
            try:
                all_procs_cpu[p.pid] = p.cpu_percent()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # 现在获取详细进程信息
        for proc in psutil.process_iter(['pid', 'name', 'username', 'status', 'nice']):
            try:
                pinfo = proc.info
                pid = pinfo['pid']

                # 跳过CPU使用率为0的进程(以减少列表长度)，除非它处于运行状态
                if pid in all_procs_cpu:
                    cpu_percent = all_procs_cpu[pid]
                    if cpu_percent == 0 and pinfo['status'] != psutil.STATUS_RUNNING:
                        continue

                # 尝试获取更多信息
                with proc.oneshot():
                    memory_info = proc.memory_info()
                    memory_percent = proc.memory_percent()

                    # 获取优先级信息
                    try:
                        priority = proc.nice()
                    except (psutil.AccessDenied, psutil.ZombieProcess):
                        priority = pinfo.get('nice', 'N/A')

                    # 计算运行时间
                    try:
                        create_time = proc.create_time()
                        running_time = time.time() - create_time
                        hours, remainder = divmod(running_time, 3600)
                        minutes, seconds = divmod(remainder, 60)
                        time_str = f"{int(hours)}:{int(minutes):02d}:{int(seconds):02d}"
                    except (psutil.AccessDenied, psutil.ZombieProcess):
                        time_str = "N/A"

                    # 获取命令行
                    try:
                        cmdline = ' '.join(proc.cmdline())
                        if not cmdline:
                            cmdline = pinfo['name']
                    except (psutil.AccessDenied, psutil.ZombieProcess):
                        cmdline = pinfo['name']

                    # 获取状态码并转换为对应的字符
                    status_map = {
                        psutil.STATUS_RUNNING: 'R',
                        psutil.STATUS_SLEEPING: 'S',
                        psutil.STATUS_DISK_SLEEP: 'D',
                        psutil.STATUS_STOPPED: 'T',
                        psutil.STATUS_TRACING_STOP: 'T',
                        psutil.STATUS_ZOMBIE: 'Z',
                        psutil.STATUS_DEAD: 'X',
                        psutil.STATUS_WAKING: 'W',
                        psutil.STATUS_IDLE: 'I',
                        psutil.STATUS_LOCKED: 'L',
                        psutil.STATUS_WAITING: 'W'
                    }
                    status = status_map.get(pinfo['status'], '?')

                    processes.append({
                        'pid': pid,
                        'user': pinfo.get('username', 'unknown'),
                        'prio': priority,
                        'ni': proc.nice() if hasattr(proc, 'nice') else 'N/A',
                        'virt': f"{memory_info.vms / (1024**2):.1f}M",
                        'res': f"{memory_info.rss / (1024**2):.1f}M",
                        'shr': f"{getattr(memory_info, 'shared', 0) / (1024**2):.1f}M",
                        'state': status,
                        'cpu': round(cpu_percent, 1),
                        'mem': round(memory_percent, 1),
                        'time': time_str,
                        'cmd': cmdline[:100]  # 限制命令长度
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess) as e:
                continue

        # 按CPU使用率排序，并限制返回数量
        processes.sort(key=lambda x: x['cpu'], reverse=True)
        processes = processes[:20]  # 只返回前20个进程

        # 获取每个CPU核心的使用率
        cpu_cores = psutil.cpu_count()
        per_cpu_percent = psutil.cpu_percent(interval=0.5, percpu=True)

        # 确保列表长度与CPU核心数一致
        if len(per_cpu_percent) < cpu_cores:
            per_cpu_percent.extend([0] * (cpu_cores - len(per_cpu_percent)))

        return {
            'processCount': process_count,
            'threadCount': thread_count,
            'runningCount': running_count,
            'loadAvg': load_avg_str,
            'cpuUser': cpu_user,
            'cpuSystem': cpu_system,
            'cpuIrq': cpu_irq,
            'cpuIdle': cpu_idle,
            'memUsed': mem_used,
            'memFree': mem_free,
            'memBuffer': mem_buff,
            'swapUsed': swap_used,
            'swapFree': swap_free,
            'cpuCores': cpu_cores,
            'processes': processes,
            'cpuUsage': per_cpu_percent[:cpu_cores]
        }
    except Exception as e:
        print(f"获取htop数据时出错: {e}")
        return {
            'processCount': 0,
            'threadCount': 0,
            'runningCount': 0,
            'loadAvg': "0.00 0.00 0.00",
            'cpuUser': 0,
            'cpuSystem': 0,
            'cpuIrq': 0,
            'cpuIdle': 0,
            'memUsed': "0GB",
            'memFree': "0GB",
            'memBuffer': "0GB",
            'swapUsed': "0GB",
            'swapFree': "0GB",
            'cpuCores': 0,
            'processes': [],
            'cpuUsage': []
        }

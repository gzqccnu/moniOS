#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import psutil
import socket
import netifaces
import time
import datetime
import json
import os
from collections import deque, defaultdict
import subprocess
import sys
from scapy.all import sniff, IP, TCP, UDP


# 存储网络历史数据的全局变量
network_history = deque(maxlen=13)  # 存储13个时间点的数据（一小时一个点）
last_net_io = None
last_net_time = None

def get_primary_interface():
    """获取主要网络接口名称"""
    try:
        # 获取默认网关对应的接口
        gws = netifaces.gateways()
        if 'default' in gws and netifaces.AF_INET in gws['default']:
            interface = gws['default'][netifaces.AF_INET][1]
            return interface
        
        # 如果上面的方法失败，尝试获取第一个非回环地址的接口
        for interface in netifaces.interfaces():
            addresses = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addresses and not addresses[netifaces.AF_INET][0]['addr'].startswith('127.'):
                return interface
        
        # 如果还是失败，返回第一个接口
        interfaces = netifaces.interfaces()
        if interfaces:
            return interfaces[0]
        return None
    except Exception as e:
        print(f"获取主要网络接口时出错: {e}")
        return None

def get_network_info():
    """获取网络接口信息"""
    try:
        interface = get_primary_interface()
        if not interface:
            raise Exception("未找到有效的网络接口")
        
        # 获取接口地址信息
        addresses = netifaces.ifaddresses(interface)
        
        # 获取IPv4地址
        ipv4_info = addresses.get(netifaces.AF_INET, [{}])[0]
        primary_ip = ipv4_info.get('addr', '未知')
        
        # 获取MAC地址
        mac_info = addresses.get(netifaces.AF_LINK, [{}])[0]
        mac_address = mac_info.get('addr', '未知')
        
        # 获取DNS服务器
        dns_servers = []
        if os.path.exists('/etc/resolv.conf'):
            with open('/etc/resolv.conf', 'r') as f:
                for line in f:
                    if line.startswith('nameserver'):
                        dns_servers.append(line.split()[1])
        
        # 如果无法从文件获取DNS，尝试从netifaces获取
        if not dns_servers:
            try:
                import dns.resolver
                dns_servers = dns.resolver.Resolver().nameservers
            except:
                pass
        
        # 获取网关
        gateway = '未知'
        gws = netifaces.gateways()
        if 'default' in gws and netifaces.AF_INET in gws['default']:
            gateway = gws['default'][netifaces.AF_INET][0]
        
        return {
            'primaryIp': primary_ip,
            'macAddress': mac_address,
            'dnsServers': ', '.join(dns_servers) if dns_servers else '未知',
            'gateway': gateway
        }
    except Exception as e:
        print(f"获取网络信息时出错: {e}")
        return {
            'primaryIp': '未知',
            'macAddress': '未知',
            'dnsServers': '未知',
            'gateway': '未知'
        }

def update_network_history():
    """更新网络历史数据"""
    global last_net_io, last_net_time, network_history
    
    try:
        current_time = time.time()
        current_net_io = psutil.net_io_counters()
        
        # 首次运行时初始化
        if last_net_io is None or last_net_time is None:
            last_net_io = current_net_io
            last_net_time = current_time
            
            # 如果持久化的历史数据存在，尝试加载
            if os.path.exists('network_history.json'):
                try:
                    with open('network_history.json', 'r') as f:
                        saved_history = json.load(f)
                        network_history = deque(saved_history, maxlen=13)
                except Exception as e:
                    print(f"加载网络历史数据失败: {e}")
            
            # 没有历史数据时生成模拟数据
            if not network_history:
                for i in range(13):
                    hour = i % 24
                    network_history.append({
                        'time': f"{hour:02d}:00",
                        'rx': 0,
                        'tx': 0
                    })
            
            return
        
        # 计算时间差(秒)
        time_diff = current_time - last_net_time
        
        if time_diff > 0:
            # 计算速率(MB/s)
            rx_speed = (current_net_io.bytes_recv - last_net_io.bytes_recv) / time_diff / (1024 * 1024)
            tx_speed = (current_net_io.bytes_sent - last_net_io.bytes_sent) / time_diff / (1024 * 1024)
            
            # 每小时记录一次数据
            current_hour = datetime.datetime.now().hour
            current_minute = datetime.datetime.now().minute
            
            # 创建新的数据点
            new_data_point = {
                'time': f"{current_hour:02d}:00",
                'rx': round(rx_speed, 2),
                'tx': round(tx_speed, 2)
            }
            
            # 检查最新的数据点是否是当前小时
            if network_history:
                latest_hour = int(network_history[-1]['time'].split(':')[0])
                if latest_hour != current_hour:
                    network_history.append(new_data_point)
                    
                    # 保存历史数据到文件
                    try:
                        with open('network_history.json', 'w') as f:
                            json.dump(list(network_history), f)
                    except Exception as e:
                        print(f"保存网络历史数据失败: {e}")
            else:
                network_history.append(new_data_point)
            
            # 更新上次测量数据
            last_net_io = current_net_io
            last_net_time = current_time
    except Exception as e:
        print(f"更新网络历史数据时出错: {e}")

def get_network_usage():
    """获取网络使用情况"""
    try:
        # 更新网络历史数据
        update_network_history()
        
        # 返回历史数据
        return list(network_history)
    except Exception as e:
        print(f"获取网络使用情况时出错: {e}")
        
        # 返回模拟数据
        return [
            {'time': '00:00', 'rx': 0, 'tx': 0},
            {'time': '01:00', 'rx': 0, 'tx': 0},
            {'time': '02:00', 'rx': 0, 'tx': 0},
            {'time': '03:00', 'rx': 0, 'tx': 0},
            {'time': '04:00', 'rx': 0, 'tx': 0},
            {'time': '05:00', 'rx': 0, 'tx': 0},
            {'time': '06:00', 'rx': 0, 'tx': 0},
            {'time': '07:00', 'rx': 0, 'tx': 0},
            {'time': '08:00', 'rx': 0, 'tx': 0},
            {'time': '09:00', 'rx': 0, 'tx': 0},
            {'time': '10:00', 'rx': 0, 'tx': 0},
            {'time': '11:00', 'rx': 0, 'tx': 0},
            {'time': '12:00', 'rx': 0, 'tx': 0}
        ]

# def get_iftop_data():
#     """获取网络流量数据(使用psutil替代iftop)"""
#     try:
#         connections = []
#         total_rx = 0
#         total_tx = 0
        
#         # 获取网络连接信息
#         net_connections = psutil.net_connections(kind='inet')
#         for conn in net_connections:
#             if conn.status == 'ESTABLISHED':
#                 source = f"{conn.laddr.ip}:{conn.laddr.port}"
#                 dest = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "unknown"
                
#                 # 获取进程信息
#                 try:
#                     p = psutil.Process(conn.pid)
#                     process_name = p.name()
#                 except:
#                     process_name = "unknown"
                
#                 connections.append({
#                     'source': source,
#                     'destination': dest,
#                     'process': process_name,
#                     'sent': 'N/A',  # psutil不提供单个连接流量统计
#                     'received': 'N/A',
#                     'total': 'N/A'
#                 })
        
#         # 获取总流量统计
#         net_io = psutil.net_io_counters()
#         total_rx = net_io.bytes_recv / (1024 * 1024)  # 转换为MB
#         total_tx = net_io.bytes_sent / (1024 * 1024)  # 转换为MB
        
#         return {
#             'connections': connections[:10],  # 只返回前10个连接
#             'total_rx': round(total_rx, 2),
#             'total_tx': round(total_tx, 2),
#             'update_time': time.strftime("%H:%M:%S")
#         }
            
#     except Exception as e:
#         return {
#             'error': 'Network monitoring error',
#             'details': str(e),
#             'solution': 'Ensure psutil is installed (pip install psutil)'
#         }

def get_iftop_data(duration=1.0, top_n=10):
    """
    抓包 duration 秒，统计每条连接（本地IP:port -> 远端IP:port）的发送/接收流量。
    返回字典：
      {
        'connections': [
           {
             'source': ...,
             'destination': ...,
             'protocol': 'TCP' or 'UDP',
             'sent': bytes,
             'received': bytes
           }, ...
        ],
        'total_rx_mb': float,
        'total_tx_mb': float,
        'update_time': 'HH:MM:SS'
      }
    """
    # 1) 收集本机所有 IPv4 地址
    local_ips = set()
    for addrs in psutil.net_if_addrs().values():
        for addr in addrs:
            if addr.family == socket.AF_INET:
                local_ips.add(addr.address)

    # 2) 定义统计容器
    #  key = (src_ip:src_port, dst_ip:dst_port, proto)
    #  value = {'sent': bytes, 'received': bytes}
    counters = defaultdict(lambda: {'sent': 0, 'received': 0})

    def _pkt_cb(pkt):
        if IP not in pkt:
            return
        ip = pkt[IP]
        proto = 'TCP' if TCP in pkt else ('UDP' if UDP in pkt else None)
        if proto is None:
            return

        # 五元组键
        sport = pkt.sport if proto == 'UDP' else pkt[TCP].sport
        dport = pkt.dport if proto == 'UDP' else pkt[TCP].dport
        src = f"{ip.src}:{sport}"
        dst = f"{ip.dst}:{dport}"
        plen = len(pkt)

        if ip.src in local_ips:
            # 本机发出
            counters[(src, dst, proto)]['sent'] += plen
        elif ip.dst in local_ips:
            # 本机接收
            counters[(src, dst, proto)]['received'] += plen

    # 3) 开始抓包
    sniff(prn=_pkt_cb, timeout=duration)

    # 4) 获取全局网卡总量
    net_io = psutil.net_io_counters()
    total_rx_mb = net_io.bytes_recv / (1024 * 1024)
    total_tx_mb = net_io.bytes_sent / (1024 * 1024)

    # 5) 构造前 top_n 条连接列表
    #    按（sent+received）降序
    conns = sorted(
        (
            {
                'source': src,
                'destination': dst,
                'protocol': proto,
                'sent': info['sent'],
                'received': info['received']
            }
            for (src, dst, proto), info in counters.items()
        ),
        key=lambda x: x['sent'] + x['received'],
        reverse=True
    )[:top_n]

    return {
        'connections': conns,
        'total_rx_mb': round(total_rx_mb, 2),
        'total_tx_mb': round(total_tx_mb, 2),
        'update_time': time.strftime("%H:%M:%S")
    }

if __name__ == '__main__':
    data = get_iftop_data(duration=1.5, top_n=8)
    from pprint import pprint
    pprint(data)



# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

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

# {

#         'connections': [

#           {

#             'source': 'ip:port',

#             'destination': 'ip:port',

#             'protocol': 'TCP'|'UDP',

#             'sent': bytes,

#             'received': bytes,

#             'pid': int,

#             'process': str

#           }, ...

#         ],

#         'total_rx_mb': float,

#         'total_tx_mb': float,

#         'update_time': 'HH:MM:SS'

#       }


def get_iftop_data(duration: float = 1.0, top_n: int = 10):
    """
    抓包 duration 秒，统计每条连接（本地IP:port -> 远端IP:port）的发送/接收流量，
    并关联 psutil.net_connections() 拿到的 pid/process 信息。

    返回：
      {
        'connections': [
          {
            'source': 'ip:port',
            'destination': 'ip:port',
            'protocol': 'TCP'|'UDP',
            'sent': bytes,
            'received': bytes,
            'pid': int,
            'process': str
          }, ...
        ],
        'total_rx_mb': float,
        'total_tx_mb': float,
        'update_time': 'HH:MM:SS'
      }
    """
    # 1) 收集所有本机 IPv4 地址
    local_ips = {
        addr.address
        for addrs in psutil.net_if_addrs().values()
        for addr in addrs
        if addr.family == socket.AF_INET
    }

    # 2) 用 Scapy 抓包，统计每条连接的流量
    #    key = (laddr, raddr, proto)  value = {'sent':bytes,'received':bytes}
    counters = defaultdict(lambda: {'sent': 0, 'received': 0})

    def _pkt_cb(pkt):
        if IP not in pkt:
            return
        proto = 'TCP' if TCP in pkt else ('UDP' if UDP in pkt else None)
        if not proto:
            return

        sport = pkt[TCP].sport if proto == 'TCP' else pkt[UDP].sport
        dport = pkt[TCP].dport if proto == 'TCP' else pkt[UDP].dport
        src_ip, dst_ip = pkt[IP].src, pkt[IP].dst
        plen = len(pkt)

        # 出站
        if src_ip in local_ips:
            laddr = f"{src_ip}:{sport}"
            raddr = f"{dst_ip}:{dport}"
            counters[(laddr, raddr, proto)]['sent'] += plen
        # 入站
        elif dst_ip in local_ips:
            laddr = f"{dst_ip}:{dport}"
            raddr = f"{src_ip}:{sport}"
            counters[(laddr, raddr, proto)]['received'] += plen

    sniff(prn=_pkt_cb, timeout=duration, store=False)

    # 3) 获取系统级总流量
    net_io = psutil.net_io_counters()
    total_rx_mb = net_io.bytes_recv / 1024 / 1024
    total_tx_mb = net_io.bytes_sent / 1024 / 1024

    # 4) 构造每条连接的基础信息 + pid/process
    conns = []
    for conn in psutil.net_connections(kind='inet'):
        if not conn.laddr or not conn.raddr:
            continue
        # 只看 ESTABLISHED 或 LISTEN
        if conn.status not in (psutil.CONN_ESTABLISHED, psutil.CONN_LISTEN):
            continue

        laddr = f"{conn.laddr.ip}:{conn.laddr.port}"
        raddr = f"{conn.raddr.ip}:{conn.raddr.port}"
        proto = 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP'
        pid = conn.pid or -1
        try:
            pname = psutil.Process(pid).name() if pid > 0 else 'Unknown'
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pname = 'Unknown'

        conns.append({
            'source': laddr,
            'destination': raddr,
            'protocol': proto,
            'sent': 0,
            'received': 0,
            'pid': pid,
            'process': pname
        })

    # 5) 把抓包结果合并到每条连接上
    #    通过 (source, destination, protocol) 三元组来匹配
    for c in conns:
        key = (c['source'], c['destination'], c['protocol'])
        info = counters.get(key)
        if info:
            c['sent'] = info['sent']
            c['received'] = info['received']

    # 6) 取 top_n 条按流量总量排序
    conns = sorted(conns, key=lambda x: x['sent'] + x['received'], reverse=True)[:top_n]

    return {
        'connections': conns,
        'total_rx_mb': round(total_rx_mb, 2),
        'total_tx_mb': round(total_tx_mb, 2),
        'update_time': time.strftime('%H:%M:%S')
    }

if __name__ == '__main__':
    import json
    data = get_iftop_data(duration=2.0, top_n=10)
    print(json.dumps(data, ensure_ascii=False, indent=2))

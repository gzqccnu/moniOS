#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import json
import sys
import os
import time
import re
from shutil import which

# 全局变量存储osquery的可用性
osquery_available = None

def is_osquery_available():
    """检查osquery是否可用"""
    global osquery_available
    
    if osquery_available is None:
        osquery_available = which('osqueryi') is not None
    
    return osquery_available

def sanitize_query(query):
    """净化SQL查询，防止执行危险命令"""
    # 检查查询是否以SELECT开头
    if not re.match(r'^\s*SELECT', query, re.IGNORECASE):
        raise ValueError("只允许执行SELECT查询")
    
    # 检查是否有多条SQL语句（由分号分隔）
    statements = [s.strip() for s in query.split(';') if s.strip()]
    if len(statements) > 1:
        statements = [s for s in statements if re.match(r'^\s*SELECT', s, re.IGNORECASE)]
        if len(statements) > 1:
            raise ValueError("一次只能执行一条SELECT查询")
        query = statements[0] + ';'
    elif not query.endswith(';'):
        query += ';'
    
    # 检查是否包含危险关键词
    dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE']
    for keyword in dangerous_keywords:
        pattern = r'\b' + keyword + r'\b'
        if re.search(pattern, query, re.IGNORECASE):
            raise ValueError(f"查询包含不允许的关键词: {keyword}")
    
    return query

def execute_osquery(query):
    """执行osquery SQL查询"""
    if not is_osquery_available():
        return handle_osquery_unavailable(query)
    
    try:
        # 净化查询
        safe_query = sanitize_query(query)
        
        # 执行osquery命令
        cmd = ['osqueryi', '--json', safe_query]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate(timeout=30)  # 设置超时时间为30秒
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            print(f"osquery执行失败: {error_msg}")
            return {'error': f"查询执行失败: {error_msg}"}
        
        output = stdout.decode('utf-8', errors='ignore')
        
        try:
            # 尝试解析JSON输出
            result = json.loads(output)
            return result
        except json.JSONDecodeError:
            # 如果不是JSON格式，返回原始文本
            return [{'result': output}]
        
    except ValueError as e:
        # 查询验证失败
        return {'error': str(e)}
    except (subprocess.SubprocessError, subprocess.TimeoutExpired) as e:
        # 执行命令失败
        return {'error': f"执行查询超时或失败: {str(e)}"}
    except Exception as e:
        # 其他错误
        return {'error': f"执行查询时发生错误: {str(e)}"}

def mock_osquery_result(query):
    """生成模拟的osquery结果"""
    # 简单的映射，根据查询关键字返回不同的模拟数据
    if 'processes' in query.lower():
        return mock_processes()
    elif 'users' in query.lower():
        return mock_users()
    elif 'system_info' in query.lower():
        return mock_system_info()
    elif 'listening_ports' in query.lower():
        return mock_listening_ports()
    elif 'services' in query.lower():
        return mock_services()
    else:
        return [{'status': '模拟查询执行成功，但没有匹配的模拟数据。请使用推荐的示例查询。'}]

def mock_processes():
    """模拟进程数据"""
    return [
        {"pid": 1, "name": "systemd", "uid": 0, "gid": 0, "cmdline": "/sbin/init", "state": "S"},
        {"pid": 854, "name": "sshd", "uid": 0, "gid": 0, "cmdline": "/usr/sbin/sshd -D", "state": "S"},
        {"pid": 1056, "name": "nginx", "uid": 33, "gid": 33, "cmdline": "nginx: master process", "state": "S"},
        {"pid": 1245, "name": "mysqld", "uid": 105, "gid": 109, "cmdline": "/usr/sbin/mysqld", "state": "S"},
        {"pid": 1345, "name": "osqueryd", "uid": 0, "gid": 0, "cmdline": "/usr/bin/osqueryd", "state": "S"},
        {"pid": 1567, "name": "postgres", "uid": 26, "gid": 26, "cmdline": "/usr/lib/postgresql/13/bin/postgres", "state": "S"},
        {"pid": 1789, "name": "php-fpm", "uid": 33, "gid": 33, "cmdline": "php-fpm: pool www", "state": "S"},
        {"pid": 1890, "name": "redis-server", "uid": 107, "gid": 112, "cmdline": "/usr/bin/redis-server 127.0.0.1:6379", "state": "S"},
        {"pid": 2034, "name": "node", "uid": 1000, "gid": 1000, "cmdline": "node /srv/app/server.js", "state": "S"},
        {"pid": 2156, "name": "python3", "uid": 1000, "gid": 1000, "cmdline": "python3 /srv/app/script.py", "state": "R"}
    ]

def mock_users():
    """模拟用户数据"""
    return [
        {"username": "root", "uid": 0, "gid": 0, "description": "root", "directory": "/root", "shell": "/bin/bash"},
        {"username": "www-data", "uid": 33, "gid": 33, "description": "www-data", "directory": "/var/www", "shell": "/usr/sbin/nologin"},
        {"username": "postgres", "uid": 26, "gid": 26, "description": "PostgreSQL administrator", "directory": "/var/lib/postgresql", "shell": "/bin/bash"},
        {"username": "mysql", "uid": 105, "gid": 109, "description": "MySQL Server", "directory": "/var/lib/mysql", "shell": "/bin/false"},
        {"username": "redis", "uid": 107, "gid": 112, "description": "Redis Server", "directory": "/var/lib/redis", "shell": "/usr/sbin/nologin"},
        {"username": "ubuntu", "uid": 1000, "gid": 1000, "description": "Ubuntu User", "directory": "/home/ubuntu", "shell": "/bin/bash"}
    ]

def mock_system_info():
    """模拟系统信息数据"""
    return [{
        "hostname": "server-01",
        "uuid": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
        "cpu_brand": "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
        "cpu_physical_cores": 14,
        "cpu_logical_cores": 28,
        "cpu_sockets": 1,
        "physical_memory": 34359738368,  # 32 GB in bytes
        "hardware_vendor": "Dell Inc.",
        "hardware_model": "PowerEdge R730",
        "hardware_version": "A00",
        "hardware_serial": "ABCDEF1234567890",
        "computer_name": "server-01",
        "local_hostname": "server-01",
        "os_version": "Ubuntu 22.04.1 LTS",
        "os_name": "Ubuntu",
        "os_arch": "x86_64",
        "platform": "ubuntu",
        "platform_like": "debian",
        "codename": "jammy"
    }]

def mock_listening_ports():
    """模拟监听端口数据"""
    return [
        {"pid": 854, "port": 22, "protocol": "tcp", "address": "0.0.0.0", "name": "sshd", "state": "LISTEN"},
        {"pid": 1056, "port": 80, "protocol": "tcp", "address": "0.0.0.0", "name": "nginx", "state": "LISTEN"},
        {"pid": 1056, "port": 443, "protocol": "tcp", "address": "0.0.0.0", "name": "nginx", "state": "LISTEN"},
        {"pid": 1245, "port": 3306, "protocol": "tcp", "address": "127.0.0.1", "name": "mysqld", "state": "LISTEN"},
        {"pid": 1567, "port": 5432, "protocol": "tcp", "address": "127.0.0.1", "name": "postgres", "state": "LISTEN"},
        {"pid": 1890, "port": 6379, "protocol": "tcp", "address": "127.0.0.1", "name": "redis-server", "state": "LISTEN"},
        {"pid": 2034, "port": 3000, "protocol": "tcp", "address": "127.0.0.1", "name": "node", "state": "LISTEN"}
    ]

def mock_services():
    """模拟服务数据"""
    return [
        {"name": "ssh", "display_name": "OpenSSH server", "status": "running", "start_type": "automatic"},
        {"name": "nginx", "display_name": "nginx web server", "status": "running", "start_type": "automatic"},
        {"name": "mysql", "display_name": "MySQL Database Server", "status": "running", "start_type": "automatic"},
        {"name": "postgresql", "display_name": "PostgreSQL RDBMS", "status": "running", "start_type": "automatic"},
        {"name": "redis", "display_name": "Redis Server", "status": "running", "start_type": "automatic"},
        {"name": "osquery", "display_name": "osquery daemon", "status": "running", "start_type": "automatic"},
        {"name": "cron", "display_name": "Regular background program processing daemon", "status": "running", "start_type": "automatic"},
        {"name": "ufw", "display_name": "Uncomplicated firewall", "status": "running", "start_type": "automatic"}
    ]

def handle_osquery_unavailable(query):
    """处理osquery不可用的情况"""
    print("osquery工具不可用，使用模拟数据")
    return mock_osquery_result(query) 
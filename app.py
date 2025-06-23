#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import json
import subprocess
import psutil
import platform
import datetime
import time
import socket
import netifaces
import pwd
import grp
import threading

# 导入自定义模块
from utils.system_info import get_system_info, get_resource_usage
from utils.process_info import get_processes, get_htop_data
from utils.network_info import get_network_info, get_network_usage
#from utils.perf_info import get_perf_data
from utils.user_info import get_users_info
from utils.osquery_handler import execute_osquery
from utils.ssh_manager import SSHManager
from utils.logger import setup_logger

app = Flask(__name__, static_folder='static')
CORS(app)  # 启用跨域请求
app.config['SECRET_KEY'] = 'dev-secret-key'  # 为Flask-SocketIO设置密钥

# 初始化SocketIO
socketio = SocketIO(app, async_mode='threading', cors_allowed_origins="*")

# 初始化SSH管理器
ssh_manager = SSHManager()

# 初始化日志
logger = setup_logger('app')

# 前端静态文件服务
@app.route('/')
def index():
    return send_from_directory('static', 'dashboard_os_info.html')

@app.route('/terminal')
def terminal():
    return send_from_directory('static', 'dashboard_os_info.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

# API端点：获取所有监控数据
@app.route('/api/all_data', methods=['GET'])
def get_all_data():
    """获取所有监控数据的综合接口"""
    try:
        data = {
            'systemInfo': get_system_info(),
            'resourceUsage': get_resource_usage(),
            'networkInfo': get_network_info(),
            'processes': get_processes(),
            'htopData': get_htop_data(),
            'users': get_users_info(),
            'networkUsage': get_network_usage()
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 新增CPU调试信息API端点
@app.route('/api/debug/cpu_info', methods=['GET'])
def debug_cpu_info():
    """返回CPU信息的调试详情"""
    try:
        system = platform.system()
        result = {
            'platform_system': system,
            'platform_machine': platform.machine(),
            'platform_processor': platform.processor(),
            'platform_version': platform.version(),
            'platform_release': platform.release(),
            'platform_node': platform.node(),
            'platform_uname': platform.uname()._asdict(),
        }
        
        # 尝试获取系统特定的CPU信息
        if system == 'Linux':
            cpu_info = get_cpu_info_linux()
            result['get_cpu_info_linux'] = cpu_info
            
            # 尝试直接获取/proc/cpuinfo内容
            if os.path.exists('/proc/cpuinfo'):
                try:
                    with open('/proc/cpuinfo', 'r') as f:
                        cpuinfo_content = f.read()
                        result['proc_cpuinfo_exists'] = True
                        result['proc_cpuinfo_sample'] = cpuinfo_content[:1000]  # 前1000个字符
                        
                        # 解析字段
                        field_values = {}
                        for line in cpuinfo_content.splitlines():
                            if ':' in line:
                                key, value = line.split(':', 1)
                                field_values[key.strip()] = value.strip()
                        result['proc_cpuinfo_fields'] = field_values
                except Exception as e:
                    result['proc_cpuinfo_error'] = str(e)
            else:
                result['proc_cpuinfo_exists'] = False
            
            # 尝试执行lscpu命令
            try:
                lscpu_output = subprocess.check_output('lscpu', shell=True).decode('utf-8', errors='ignore')
                result['lscpu_output'] = lscpu_output[:1000]  # 前1000个字符
            except Exception as e:
                result['lscpu_error'] = str(e)
                
        elif system == 'Windows':
            result['get_cpu_info_windows'] = get_cpu_info_windows()
            
            # 尝试使用wmic命令
            try:
                wmic_output = subprocess.check_output('wmic cpu get name', shell=True).decode('utf-8', errors='ignore')
                result['wmic_output'] = wmic_output
            except Exception as e:
                result['wmic_error'] = str(e)
        
        # 获取psutil的CPU信息
        result['psutil_cpu_count_logical'] = psutil.cpu_count(logical=True)
        result['psutil_cpu_count_physical'] = psutil.cpu_count(logical=False)
        
        # 常规系统信息获取结果
        result['get_system_info'] = get_system_info()
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'调试CPU信息出错: {str(e)}'}), 500

# API端点：获取系统信息
@app.route('/api/system_info', methods=['GET'])
def system_info():
    """获取系统基本信息"""
    try:
        return jsonify(get_system_info())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：获取资源使用情况
@app.route('/api/resource_usage', methods=['GET'])
def resource_usage():
    """获取CPU、内存、磁盘等资源使用情况"""
    try:
        return jsonify(get_resource_usage())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：获取进程列表
@app.route('/api/processes', methods=['GET'])
def processes():
    """获取进程列表信息"""
    try:
        return jsonify(get_processes())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：获取htop样式的进程视图数据
@app.route('/api/htop', methods=['GET'])
def htop():
    """获取类似htop的进程详细信息"""
    try:
        return jsonify(get_htop_data())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# API端点：获取网络信息
@app.route('/api/network_info', methods=['GET'])
def network_info():
    """获取网络接口信息"""
    try:
        return jsonify(get_network_info())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：获取网络使用情况
@app.route('/api/network_usage', methods=['GET'])
def network_usage():
    """获取网络带宽使用情况"""
    try:
        return jsonify(get_network_usage())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：获取用户信息
@app.route('/api/users', methods=['GET'])
def users():
    """获取系统用户账户信息"""
    try:
        return jsonify(get_users_info())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API端点：执行osquery查询
@app.route('/api/osquery', methods=['POST'])
def osquery():
    """执行osquery SQL查询"""
    try:
        query = request.json.get('query', '')
        if not query:
            return jsonify({'error': '查询语句不能为空'}), 400
        
        result = execute_osquery(query)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 用于缓存上一次采样
last_proc_net = {}
last_time = [time.time()]

@app.route('/api/iftop')
def api_iftop():
    """获取网络连接和流量数据"""
    try:
        from utils.network_info import get_iftop_data
        
        result = get_iftop_data()
        
        if 'error' in result:
            return jsonify({
                'error': result.get('error'),
                'details': result.get('details', ''),
                'solution': result.get('solution', '')
            }), 500
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"iftop API错误: {str(e)}")
        return jsonify({
            'error': '获取网络流量数据失败',
            'details': str(e),
            'connections': [],
            'total_rx_mb': 0,
            'total_tx_mb': 0,
            'update_time': time.strftime('%H:%M:%S')
        })

# WebSocket连接事件
@socketio.on('connect')
def handle_connect():
    """处理WebSocket连接"""
    sid = request.sid
    logger.info(f"客户端连接: {sid}")

# SSH终端WebSocket事件处理
@socketio.on('connect_terminal')
def handle_connect_terminal(data):
    """处理终端连接请求"""
    sid = request.sid
    try:
        logger.debug(f"收到连接请求: {sid}: {data}")
        
        # 获取连接参数
        params = data.get('connect', {})
        hostname = params.get('hostname', '127.0.0.1')
        port = int(params.get('port', 22))
        username = params.get('username')
        password = params.get('password')

        # 验证必要参数
        if not hostname:
            logger.warning(f"连接失败: 主机地址为空 - {sid}")
            emit('terminal_output', {'error': '主机地址不能为空'}, room=sid)
            return False
            
        if not username:
            logger.warning(f"连接失败: 用户名为空 - {sid}")
            emit('terminal_output', {'error': '用户名不能为空'}, room=sid)
            return False
            
        if not password:
            logger.warning(f"连接失败: 密码为空 - {sid}")
            emit('terminal_output', {'error': '密码不能为空'}, room=sid)
            return False

        # 验证端口号
        if not (1 <= port <= 65535):
            logger.warning(f"连接失败: 无效的端口号 {port} - {sid}")
            emit('terminal_output', {'error': '无效的端口号'}, room=sid)
            return False

        logger.info(f"尝试连接到 {hostname}:{port} 用户名: {username}")

        # 创建新连接
        connection_result = ssh_manager.create_connection(sid, hostname, port, username, password)
        logger.debug(f"SSH连接结果: {connection_result} - {sid}")
        
        if connection_result:
            logger.info(f"成功连接到 {hostname} 用户名: {username}")
            emit('terminal_output', {'data': f'\r\n[已连接到 {hostname} 用户名: {username}]\r\n'}, room=sid)
            
            # 启动输出转发线程
            logger.debug(f"启动输出转发线程 - {sid}")
            threading.Thread(target=forward_output, args=(sid,), daemon=True).start()
            return True
        else:
            logger.error(f"连接到 {hostname} 用户名: {username} 失败")
            emit('terminal_output', {'error': '连接失败。请检查您的凭据并重试。'}, room=sid)
            return False

    except ValueError as e:
        logger.error(f"无效的端口号: {str(e)}")
        emit('terminal_output', {'error': '无效的端口号'}, room=sid)
        return False
    except Exception as e:
        logger.error(f"连接错误: {str(e)}")
        emit('terminal_output', {'error': f'连接错误: {str(e)}'}, room=sid)
        return False

def forward_output(sid):
    """转发SSH输出到WebSocket"""
    logger.debug(f"开始转发SSH输出 - {sid}")
    while ssh_manager.check_connection(sid):
        output = ssh_manager.get_output(sid)
        if output:
            logger.debug(f"转发输出数据 - {sid} - 长度: {len(output)}")
            socketio.emit('terminal_output', {'data': output}, room=sid)
        time.sleep(0.01)
    logger.debug(f"停止转发SSH输出 - {sid}")

@socketio.on('terminal_input')
def handle_terminal_input(data):
    """处理终端输入"""
    sid = request.sid
    try:
        msg = data.get('data', '')
        logger.debug(f"收到终端输入: {sid}, 数据长度: {len(msg)}")
        
        if not ssh_manager.send_data(sid, msg):
            logger.error(f"发送数据失败: {sid}")
            emit('terminal_output', {'error': '发送数据失败'}, room=sid)
        else:
            logger.debug(f"数据发送成功: {sid}")
    except Exception as e:
        logger.error(f"输入错误: {str(e)}")
        emit('terminal_output', {'error': f'输入错误: {str(e)}'}, room=sid)

@socketio.on('resize')
def handle_resize(data):
    """处理终端大小调整"""
    sid = request.sid
    try:
        cols, rows = data.get('cols', 80), data.get('rows', 24)
        logger.debug(f"调整终端大小: {sid}, {cols}x{rows}")
        
        if not ssh_manager.resize_terminal(sid, cols, rows):
            emit('terminal_output', {'error': '调整终端大小失败'}, room=sid)
    except Exception as e:
        logger.error(f"调整大小错误: {str(e)}")
        emit('terminal_output', {'error': f'调整大小错误: {str(e)}'}, room=sid)

@socketio.on('disconnect')
def handle_disconnect():
    """处理断开连接"""
    sid = request.sid
    try:
        ssh_manager.close_connection(sid)
        logger.info(f"客户端断开连接: {sid}")
    except Exception as e:
        logger.error(f"断开连接错误: {str(e)}")

if __name__ == '__main__':
    # 确保存放静态文件的目录存在
    if not os.path.exists('static'):
        os.makedirs('static')
    
    # 将前端HTML文件复制到static目录（每次启动都更新）
    html_file = 'dashboard_os_info.html'
    if os.path.exists(html_file):
        import shutil
        print(f"正在更新静态文件: {html_file} -> static/{html_file}")
        shutil.copy(html_file, os.path.join('static', html_file))
    
    # 使用socketio启动应用
    print("启动SSH终端服务器，访问 http://127.0.0.1:6789/terminal 使用SSH终端")
    socketio.run(app, host='127.0.0.1', port=6789, debug=True)


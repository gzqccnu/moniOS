import paramiko
import threading
import time
import os
import logging

# 获取日志记录器
logger = logging.getLogger('app')

class SSHManager:
    def __init__(self):
        self.clients = {}
        self.lock = threading.Lock()
        
        # SSH配置
        self.SSH_TIMEOUT = 30
        self.SSH_BANNER_TIMEOUT = 30
        self.SSH_AUTH_TIMEOUT = 30
        
        # 心跳检测配置
        self.HEARTBEAT_TIMEOUT = 60   # 秒
    
    def create_connection(self, sid, hostname, port, username, password):
        """创建新的SSH连接"""
        try:
            logger.debug(f"creating ssh connection: {sid} -> {hostname}:{port}")
            
            # 创建SSH客户端
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # 连接服务器
            logger.debug(f"trying to connect to server: {hostname}:{port}")
            ssh.connect(
                hostname=hostname,
                port=port,
                username=username,
                password=password,
                timeout=self.SSH_TIMEOUT,
                banner_timeout=self.SSH_BANNER_TIMEOUT,
                auth_timeout=self.SSH_AUTH_TIMEOUT,
                allow_agent=False,
                look_for_keys=False
            )
            
            # 创建交互式shell，确保使用支持UTF-8的终端类型
            logger.debug(f"creating interactive shell: {sid}")
            # 使用xterm-256color，确保支持UTF-8
            channel = ssh.invoke_shell(term='xterm-256color', width=80, height=24)
            channel.settimeout(0.0)
            
            # 设置环境变量以支持UTF-8
            transport = channel.get_transport()
            if transport:
                logger.debug(f"Setting up UTF-8 environment variables for {sid}")
                # 设置UTF-8相关的环境变量，提高中文兼容性
                try:
                    ssh.exec_command('export LANG=en_US.UTF-8')
                    ssh.exec_command('export LC_ALL=en_US.UTF-8')
                    ssh.exec_command('export TERM=xterm-256color')
                    logger.debug(f"UTF-8 environment variables set for {sid}")
                except Exception as e:
                    logger.warning(f"Failed to set UTF-8 environment variables: {str(e)}")
            
            # 存储连接信息
            with self.lock:
                self.clients[sid] = {
                    'ssh': ssh,
                    'channel': channel,
                    'last_activity': time.time(),
                    'running': True
                }
            
            logger.info(f"SSH connecting successed: {sid} -> {hostname}:{port}")
            return True
            
        except paramiko.AuthenticationException as e:
            logger.error(f"SSH authentication failed: {sid} -> {hostname}:{port} - {str(e)}")
            return False
        except paramiko.SSHException as e:
            logger.error(f"SSH connecting error: {sid} -> {hostname}:{port} - {str(e)}")
            return False
        except Exception as e:
            logger.error(f"error when creating SSH connection: {sid} -> {hostname}:{port} - {str(e)}")
            return False
    
    def close_connection(self, sid):
        """关闭SSH连接"""
        with self.lock:
            if sid in self.clients:
                client = self.clients[sid]
                try:
                    logger.debug(f"close SSH connection: {sid}")
                    if client['channel']:
                        client['channel'].close()
                    if client['ssh']:
                        client['ssh'].close()
                    logger.info(f"ssh closed: {sid}")
                except Exception as e:
                    logger.error(f"error when closing ssh: {sid} - {str(e)}")
                finally:
                    del self.clients[sid]
                    logger.debug(f"removed from client list: {sid}")
            else:
                logger.debug(f"trying to clsoe non-existent connection: {sid}")
    
    def send_data(self, sid, data):
        """发送数据到SSH通道"""
        with self.lock:
            client = self.clients.get(sid)
            if client and client['running']:
                try:
                    logger.debug(f"sending data to SSH tunle: {sid}, 长度: {len(data)}")
                    # 直接发送数据，不尝试编码
                    # 如果数据是ASCII字符，直接发送
                    # 如果是中文等UTF-8字符，确保正确处理
                    try:
                        if isinstance(data, str):
                            client['channel'].send(data)
                        else:
                            client['channel'].send(data)
                    except Exception as e:
                        logger.error(f"error when encoding data: {sid} - {str(e)}")
                        # 如果出错，尝试不同的编码方式
                        client['channel'].send(data.encode('utf-8', errors='ignore'))
                    
                    client['last_activity'] = time.time()
                    return True
                except Exception as e:
                    logger.error(f"error when sending data to SSH tunle: {sid} - {str(e)}")
                    self.close_connection(sid)
            else:
                logger.warning(f"trying to sending data to non-existent connection: {sid}")
        return False
    
    def get_output(self, sid):
        """获取SSH通道的输出"""
        with self.lock:
            client = self.clients.get(sid)
            if client and client['running']:
                try:
                    if client['channel'].recv_ready():
                        data = client['channel'].recv(4096)
                        if data:
                            client['last_activity'] = time.time()
                            return data.decode(errors='ignore')
                except Exception as e:
                    logger.error(f"error when recieving data from SSH tunle: {sid} - {str(e)}")
                    self.close_connection(sid)
            elif client is None:
                logger.debug(f"trying to get non-existent connection's print: {sid}")
        return None
    
    def check_connection(self, sid):
        """检查连接是否活跃"""
        with self.lock:
            client = self.clients.get(sid)
            if client:
                if time.time() - client['last_activity'] > self.HEARTBEAT_TIMEOUT:
                    logger.warning(f"SSH connect timed out: {sid}, final active: {time.time() - client['last_activity']} seconds before")
                    self.close_connection(sid)
                    return False
                return True
            else:
                logger.debug(f"checking non-existent connection: {sid}")
        return False
    
    def resize_terminal(self, sid, cols, rows):
        """调整终端大小"""
        with self.lock:
            client = self.clients.get(sid)
            if client and client['running']:
                try:
                    logger.debug(f"adjust terminal's size: {sid}, {cols}x{rows}")
                    client['channel'].resize_pty(width=cols, height=rows)
                    return True
                except Exception as e:
                    logger.error(f"error when adjusting terminal's size: {sid} - {str(e)}")
            else:
                logger.warning(f"trying to get non-existent connection's terminal's size: {sid}")
        return False 
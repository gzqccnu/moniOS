/*
Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
https://github.com/gzqccnu/moniOS
*/

document.addEventListener('DOMContentLoaded', () => {
    // 初始化变量
    let socket = null;
    let term = null;
    let fitAddon = null;
    let isConnected = false;
    let currentHostname = '';
    let currentUsername = '';

    // DOM元素
    const connectionForm = document.getElementById('connection-form');
    const hostnameInput = document.getElementById('ssh_hostname');
    const portInput = document.getElementById('port');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const clearBtn = document.getElementById('clear-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
<<<<<<< HEAD
    const statusIndicator = document.querySelector('.terminal-header .status-indicator');
    const sidebarStatusDot = document.querySelector('.sidebar-header .status-dot');
    const sidebarStatusText = document.querySelector('.sidebar-header .status-text');
=======
    const statusIndicator = document.querySelector('.terminal-header .statas-indicator');

>>>>>>> 0de3d1c (fix: fonts display in status bar and in the terminal)
    const terminalContainer = document.getElementById('terminal-container');
    const connectionPanel = document.getElementById('connection-panel');
    const connectionInfo = document.getElementById('connection-info');

    // 检查必要的DOM元素是否存在
    if (!connectionForm || !terminalContainer) {
        console.error('找不到必要的终端DOM元素');
        return; // 如果关键元素不存在，则退出初始化
    }

    // 初始化终端
    function initTerminal() {
        // 创建终端实例
        term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: 'Cascadia Code, Consolas, monospace',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.2,
            theme: {
                background: '#1e1e1e',
                foreground: '#f0f0f0',
                cursor: '#f0f0f0',
                cursorAccent: '#1e1e1e',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#e06c75',
                green: '#98c379',
                yellow: '#d19a66',
                blue: '#61afef',
                magenta: '#c678dd',
                cyan: '#56b6c2',
                white: '#d0d0d0',
                brightBlack: '#808080',
                brightRed: '#e06c75',
                brightGreen: '#98c379',
                brightYellow: '#e5c07b',
                brightBlue: '#61afef',
                brightMagenta: '#c678dd',
                brightCyan: '#56b6c2',
                brightWhite: '#ffffff'
            },
            allowTransparency: false,
            convertEol: true,
            disableStdin: false, // 确保可以输入
            rendererType: 'canvas' // 使用canvas渲染器以获得更好的性能
        });

        // 创建自适应插件
        fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);

        const terminalElement = document.getElementById('terminal');
        if (!terminalElement) {
            console.error('找不到终端容器元素');
            return;
        }

        // 打开终端
        term.open(terminalElement);

        // 立即适应终端大小
        setTimeout(() => {
            fitTerminal();
        }, 100);

        // 监听窗口大小变化
        window.addEventListener('resize', fitTerminal);

        // 终端输入事件
        term.onData(data => {
            if (isConnected && socket) {
                socket.emit('terminal_input', { data: data });
                console.log('发送数据:', data); // 调试日志
            }
        });

        // 使终端可聚焦
        terminalElement.addEventListener('click', () => {
            term.focus();
        });
    }

    // 适应终端大小
    function fitTerminal() {
        if (fitAddon && term) {
            try {
                fitAddon.fit();
                console.log(`终端大小调整为: ${term.cols} x ${term.rows}`);

                if (isConnected) {
                    resizeTerminal();
                }
            } catch (e) {
                console.error('终端大小调整失败:', e);
            }
        }
    }

    // 显示连接设置面板
    function showConnectionPanel() {
        if (connectionPanel && terminalContainer) {
            connectionPanel.classList.remove('hidden');
            terminalContainer.classList.add('hidden');

            // 清空密码输入框
            if (passwordInput) {
                passwordInput.value = '';
            }

            // 重置按钮状态
            if (clearBtn) clearBtn.disabled = true;
            if (disconnectBtn) disconnectBtn.disabled = true;
        }
    }

    // 显示终端面板
    function showTerminalPanel() {
        if (connectionPanel && terminalContainer) {
            connectionPanel.classList.add('hidden');
            terminalContainer.classList.remove('hidden');

            // 更新连接信息
            if (connectionInfo) {
                connectionInfo.textContent = ` - ${currentHostname} (${currentUsername})`;
            }

            // 启用按钮
            if (clearBtn) clearBtn.disabled = false;
            if (disconnectBtn) disconnectBtn.disabled = false;

            // 调整终端大小并聚焦
            setTimeout(() => {
                fitTerminal();
                if (term) term.focus();
            }, 100);
        }
    }

    // 连接到服务器
    function connectToServer(hostname, port, username, password) {
        // 保存当前连接信息
        currentHostname = hostname;
        currentUsername = username;

        // 初始化Socket.IO连接
        socket = io();

        // 连接事件
        socket.on('connect', () => {
            console.log('Socket.IO连接成功');

            // 发送连接请求
            socket.emit('connect_terminal', {
                connect: {
                    hostname: hostname,
                    port: parseInt(port),
                    username: username,
                    password: password
                }
            });
        });

        // 终端输出事件
        socket.on('terminal_output', (data) => {
            if (!term) return;

            if (data.error) {
                term.write('\r\n\x1b[31m错误: ' + data.error + '\x1b[0m\r\n');
                disconnectFromServer();
            } else if (data.data) {
                // 如果收到数据且包含连接成功的消息，设置连接状态为已连接
                if (data.data.includes('[已连接到') || data.data.includes('[Connected to')) {
                    isConnected = true;
                    updateConnectionStatus();
                }
                term.write(data.data);
            }
        });

        // 连接断开事件
        socket.on('disconnect', () => {
            console.log('Socket.IO连接断开');
            disconnectFromServer();
        });

        // 连接错误事件
        socket.on('connect_error', (error) => {
            console.error('连接错误:', error);
            if (term) {
                term.write('\r\n\x1b[31m连接错误: ' + error.message + '\x1b[0m\r\n');
            }
            disconnectFromServer();
        });
    }

    // 断开连接
    function disconnectFromServer() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }

        isConnected = false;
        updateConnectionStatus();

        // 显示断开连接消息
        if (term) {
            term.write('\r\n\x1b[33m[连接已断开]\x1b[0m\r\n');
        }

        // 返回到连接设置面板
        showConnectionPanel();
    }

    // 更新连接状态UI
    function updateConnectionStatus() {
        if (statusIndicator) {
            if (isConnected) {
                // 更新终端状态指示器
                statusIndicator.classList.add('connected');
            } else {
                // 更新终端状态指示器
                statusIndicator.classList.remove('connected');
            }
        }
    }

    // 调整终端大小
    function resizeTerminal() {
        if (isConnected && socket && term) {
            const dimensions = term.rows + 'x' + term.cols;
            console.log('调整终端大小: ' + dimensions);
            socket.emit('resize', { cols: term.cols, rows: term.rows });
        }
    }

    // 初始化事件监听
    function initEventListeners() {
        // 连接表单提交
        if (connectionForm) {
            connectionForm.addEventListener('submit', (e) => {
                e.preventDefault();

                if (isConnected) {
                    disconnectFromServer();
                }

                // 确保所有必要的输入元素存在
                if (!hostnameInput || !portInput || !usernameInput || !passwordInput || !term) {
                    console.error('表单元素不完整');
                    return;
                }

                // 添加安全检查，确保value属性存在并且trim()方法可用
                const hostname = hostnameInput && hostnameInput.value ? (typeof hostnameInput.value.trim === 'function' ? hostnameInput.value.trim() : hostnameInput.value) : '';
                const port = portInput && portInput.value ? (typeof portInput.value.trim === 'function' ? portInput.value.trim() : portInput.value) : '22';
                const username = usernameInput && usernameInput.value ? (typeof usernameInput.value.trim === 'function' ? usernameInput.value.trim() : usernameInput.value) : '';
                const password = passwordInput && passwordInput.value ? passwordInput.value : '';

                // 验证必要的值是否存在
                if (!hostname || !username) {
                    console.error('必要的连接信息缺失');
                    if (term) {
                        term.write('\r\n\x1b[31m错误: 请填写主机地址和用户名\x1b[0m\r\n');
                    }
                    return;
                }

                // 清空终端
                term.clear();
                term.write('正在连接到 ' + hostname + '...\r\n');

                // 连接到服务器
                connectToServer(hostname, port, username, password);

                // 注意：此处不再设置isConnected状态，而是等待服务器确认连接成功

                // 切换到终端界面
                showTerminalPanel();
            });
        }

        // 清屏按钮
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (term) {
                    term.clear();
                    term.focus(); // 清屏后重新聚焦
                }
            });
        }

        // 断开连接按钮
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                disconnectFromServer();
            });
        }

        // 监听终端容器的可见性变化
        if (terminalContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isHidden = terminalContainer.classList.contains('hidden');
                        if (!isHidden && term) {
                            // 当终端容器变为可见时，调整终端大小
                            setTimeout(fitTerminal, 100);
                        }
                    }
                });
            });

            observer.observe(terminalContainer, { attributes: true });
        }
    }

    // 初始化
    initTerminal();
    initEventListeners();
    showConnectionPanel(); // 默认显示连接设置面板

    // 显示欢迎消息
    if (term) {
        term.write('\x1b[1;34m欢迎使用SSH Web终端!\x1b[0m\r\n');
        term.write('请填写连接信息并点击"连接"按钮开始使用。\r\n\r\n');
    }

    // 暴露全局方法，供其他脚本调用
    window.fitTerminal = fitTerminal;
});

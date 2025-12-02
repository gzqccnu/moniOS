
        // 全局状态管理
        class FileTransferSystem {
            constructor() {
                this.ws = null;
                this.isConnected = false;
                this.role = 'server';
                this.serverAddress = 'ws://localhost:8080';
                this.uploadQueue = new Map();
                this.downloadQueue = new Map();
                this.currentFiles = [];
                this.settings = {
                    chunkSize: 32768,
                    maxConcurrent: 3,
                    enableEncryption: true
                };
                
                this.init();
            }

            init() {
                this.bindEvents();
                this.loadSettings();
                this.updateUI();
            }

            bindEvents() {
                // 连接相关
                document.getElementById('connectBtn').addEventListener('click', () => {
                    // 1. 获取新增的密码值
                    const password = document.getElementById('serverPassword').value;
                    // 2. 获取原有参数（可选：若connect需要）
                    const serverAddress = document.getElementById('serverAddress').value;
                    const role = document.querySelector('input[name="role"]:checked')?.value || 'server';
                    
                    // 3. 传入connect函数（需你修改connect函数接收密码参数）
                    this.connect(serverAddress, role, password); 
                    // 若你的connect函数原本已有参数，调整参数顺序即可，比如：
                    // this.connect({ address: serverAddress, role: role, password: password });
                });

                document.querySelectorAll('input[name="role"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.role = e.target.value;
                        this.updateUI();
                    });
                });

                // 文件拖拽上传
                const dropZone = document.getElementById('dropZone');
                dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
                dropZone.addEventListener('drop', (e) => this.handleDrop(e));
                dropZone.addEventListener('dragleave', () => this.handleDragLeave());

                // 文件选择
                document.getElementById('browseBtn').addEventListener('click', () => {
                    document.getElementById('fileInput').click();
                });
                document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));

                // 设置相关
                document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
                document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
                document.getElementById('cancelSettings').addEventListener('click', () => this.hideSettings());
                document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

                // 文件系统操作
                document.getElementById('refreshBtn').addEventListener('click', () => this.refreshFileSystem());
                document.getElementById('parentDirBtn').addEventListener('click', () => this.navigateParent());
            }

            handleDragOver(e) {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('dropZone').classList.add('drag-over');
            }

            handleDragLeave() {
                document.getElementById('dropZone').classList.remove('drag-over');
            }

            handleDrop(e) {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('dropZone').classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    this.addFilesToUpload(e.dataTransfer.files);
                }
            }

            handleFileSelect(e) {
                if (e.target.files.length > 0) {
                    this.addFilesToUpload(e.target.files);
                }
            }

            addFilesToUpload(files) {
                const uploadQueue = document.getElementById('uploadQueue');
                const uploadItems = document.getElementById('uploadItems');
                
                uploadQueue.classList.remove('hidden');
                
                Array.from(files).forEach(file => {
                    const fileId = this.generateId();
                    const fileItem = this.createUploadItem(fileId, file);
                    
                    uploadItems.appendChild(fileItem);
                    this.uploadQueue.set(fileId, {
                        file,
                        progress: 0,
                        status: 'waiting',
                        element: fileItem
                    });
                });

                this.processUploadQueue();
            }

            createUploadItem(fileId, file) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
                item.innerHTML = `
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fa fa-file text-primary"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-800 truncate" title="${file.name}">${file.name}</div>
                            <div class="text-sm text-gray-500">${this.formatFileSize(file.size)}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-sm text-gray-600 min-w-[60px]">
                            <span id="uploadProgress-${fileId}">0%</span>
                        </div>
                        <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div id="uploadBar-${fileId}" class="bg-accent h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <button onclick="fts.cancelUpload('${fileId}')" class="text-gray-400 hover:text-red-500 p-1">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                `;
                return item;
            }

            async processUploadQueue() {
                if (!this.isConnected) {
                    await this.connect();
                }

                const activeUploads = Array.from(this.uploadQueue.values())
                    .filter(item => item.status === 'uploading').length;

                if (activeUploads >= this.settings.maxConcurrent) {
                    return;
                }

                for (const [fileId, item] of this.uploadQueue.entries()) {
                    if (item.status === 'waiting') {
                        this.startUpload(fileId, item);
                        if (activeUploads + 1 >= this.settings.maxConcurrent) {
                            break;
                        }
                    }
                }
            }

            async startUpload(fileId, item) {
                item.status = 'uploading';
                
                try {
                    // 发送文件元数据
                    const metadata = {
                        type: 'file_metadata',
                        fileId,
                        filename: item.file.name,
                        size: item.file.size,
                        type: item.file.type
                    };
                    
                    this.sendMessage(metadata);

                    // 分片上传
                    const chunkSize = this.settings.chunkSize;
                    const totalChunks = Math.ceil(item.file.size / chunkSize);
                    
                    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                        const start = chunkIndex * chunkSize;
                        const end = Math.min(start + chunkSize, item.file.size);
                        const chunk = item.file.slice(start, end);
                        
                        const chunkData = {
                            type: 'file_chunk',
                            fileId,
                            chunkIndex,
                            totalChunks,
                            data: await this.readFileAsArrayBuffer(chunk)
                        };
                        
                        this.sendMessage(chunkData);
                        
                        // 更新进度
                        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                        this.updateUploadProgress(fileId, progress);
                    }

                    // 发送完成通知
                    this.sendMessage({
                        type: 'file_complete',
                        fileId
                    });

                    item.status = 'completed';
                    this.updateUploadStatus(fileId, 'completed');
                } catch (error) {
                    console.error('Upload failed:', error);
                    item.status = 'failed';
                    this.updateUploadStatus(fileId, 'failed');
                } finally {
                    this.processUploadQueue();
                }
            }

            updateUploadProgress(fileId, progress) {
                const progressElement = document.getElementById(`uploadProgress-${fileId}`);
                const barElement = document.getElementById(`uploadBar-${fileId}`);
                
                if (progressElement && barElement) {
                    progressElement.textContent = `${progress}%`;
                    barElement.style.width = `${progress}%`;
                }
            }

            updateUploadStatus(fileId, status) {
                const item = this.uploadQueue.get(fileId);
                if (item) {
                    const statusElement = item.element.querySelector('.text-gray-600');
                    if (statusElement) {
                        switch (status) {
                            case 'completed':
                                statusElement.textContent = '完成';
                                statusElement.className = 'text-sm text-green-600';
                                break;
                            case 'failed':
                                statusElement.textContent = '失败';
                                statusElement.className = 'text-sm text-red-600';
                                break;
                        }
                    }
                }
            }

            cancelUpload(fileId) {
                const item = this.uploadQueue.get(fileId);
                if (item) {
                    item.status = 'cancelled';
                    item.element.remove();
                    this.uploadQueue.delete(fileId);
                    
                    if (this.uploadQueue.size === 0) {
                        document.getElementById('uploadQueue').classList.add('hidden');
                    }
                }
            }

        async connect() {
            if (this.isConnected) {
                this.disconnect();
            }

            try {
                // 1. 获取服务器地址（原有逻辑）
                this.serverAddress = document.getElementById('serverAddress').value;
                // 提前获取密码，供连接成功后使用
                this.connectionPassword = document.getElementById('serverPassword').value;
                
                // 2. 密码非空校验
                if (!this.connectionPassword) {
                    this.showNotification('请输入连接密码', 'error');
                    return;
                }

                // 3. 创建 WebSocket 连接（地址不变）
                this.ws = new WebSocket(this.serverAddress);
                
                this.ws.onopen = () => this.onConnected();
                this.ws.onmessage = (e) => this.onMessage(e);
                this.ws.onclose = () => this.onDisconnected();
                this.ws.onerror = (error) => this.onError(error);
            } catch (error) {
                console.error('Connection failed:', error);
                this.showNotification('连接失败', 'error');
            }
        }

            // 重点修改 onConnected 方法，新增发送密码的逻辑
            onConnected() {
                this.isConnected = true;
                this.updateConnectionStatus();
                this.showNotification('连接成功，正在验证密码...', 'success');
                
                // 发送连接信息 + 密码（核心改动）
                this.sendMessage({
                    type: 'connection_info',
                    role: this.role,
                    timestamp: Date.now(),
                    password: this.connectionPassword // 新增：携带密码
                });
            }


            disconnect() {
                if (this.ws) {
                    this.ws.close();
                    this.ws = null;
                }
                this.isConnected = false;
                this.updateConnectionStatus();
            }


            onDisconnected() {
                this.isConnected = false;
                this.updateConnectionStatus();
                this.showNotification('连接断开', 'warning');
            }

            onError(error) {
                console.error('WebSocket error:', error);
                this.showNotification('连接错误', 'error');
            }

            onMessage(event) {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            }

            handleMessage(message) {
                switch (message.type) {
                    case 'file_metadata':
                        this.handleFileMetadata(message);
                        break;
                    case 'file_chunk':
                        this.handleFileChunk(message);
                        break;
                    case 'file_complete':
                        this.handleFileComplete(message);
                        break;
                    case 'file_list':
                        this.handleFileList(message);
                        break;
                    case 'notification':
                        this.showNotification(message.content, message.level);
                        break;
                }
            }

            handleFileMetadata(metadata) {
                const fileId = metadata.fileId;
                const downloadItem = this.createDownloadItem(fileId, metadata);
                
                document.getElementById('downloadItems').appendChild(downloadItem);
                document.getElementById('downloadQueue').classList.remove('hidden');
                
                this.downloadQueue.set(fileId, {
                    metadata,
                    chunks: {},
                    totalChunks: metadata.totalChunks || 0,
                    receivedChunks: 0,
                    element: downloadItem
                });
            }

            handleFileChunk(chunk) {
                const fileId = chunk.fileId;
                const item = this.downloadQueue.get(fileId);
                
                if (item) {
                    item.chunks[chunk.chunkIndex] = chunk.data;
                    item.receivedChunks++;
                    
                    const progress = Math.round((item.receivedChunks / chunk.totalChunks) * 100);
                    this.updateDownloadProgress(fileId, progress);
                }
            }

            async handleFileComplete(message) {
                const fileId = message.fileId;
                const item = this.downloadQueue.get(fileId);
                
                if (item) {
                    try {
                        // 组装文件
                        const chunks = [];
                        for (let i = 0; i < item.totalChunks; i++) {
                            chunks.push(item.chunks[i]);
                        }
                        
                        const blob = new Blob(chunks, { type: item.metadata.type });
                        const url = URL.createObjectURL(blob);
                        
                        // 创建下载链接
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = item.metadata.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        item.status = 'completed';
                        this.updateDownloadStatus(fileId, 'completed');
                        
                        // 添加到已接收文件列表
                        this.addToReceivedFiles(item.metadata);
                    } catch (error) {
                        console.error('File assembly failed:', error);
                        item.status = 'failed';
                        this.updateDownloadStatus(fileId, 'failed');
                    }
                }
            }

            createDownloadItem(fileId, metadata) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
                item.innerHTML = `
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i class="fa fa-download text-warning"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-800 truncate" title="${metadata.filename}">${metadata.filename}</div>
                            <div class="text-sm text-gray-500">${this.formatFileSize(metadata.size)}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-sm text-gray-600 min-w-[60px]">
                            <span id="downloadProgress-${fileId}">0%</span>
                        </div>
                        <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div id="downloadBar-${fileId}" class="bg-warning h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <button onclick="fts.cancelDownload('${fileId}')" class="text-gray-400 hover:text-red-500 p-1">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                `;
                return item;
            }

            updateDownloadProgress(fileId, progress) {
                const progressElement = document.getElementById(`downloadProgress-${fileId}`);
                const barElement = document.getElementById(`downloadBar-${fileId}`);
                
                if (progressElement && barElement) {
                    progressElement.textContent = `${progress}%`;
                    barElement.style.width = `${progress}%`;
                }
            }

            updateDownloadStatus(fileId, status) {
                const item = this.downloadQueue.get(fileId);
                if (item) {
                    const statusElement = item.element.querySelector('.text-gray-600');
                    if (statusElement) {
                        switch (status) {
                            case 'completed':
                                statusElement.textContent = '完成';
                                statusElement.className = 'text-sm text-green-600';
                                break;
                            case 'failed':
                                statusElement.textContent = '失败';
                                statusElement.className = 'text-sm text-red-600';
                                break;
                        }
                    }
                }
            }

            cancelDownload(fileId) {
                const item = this.downloadQueue.get(fileId);
                if (item) {
                    item.element.remove();
                    this.downloadQueue.delete(fileId);
                    
                    if (this.downloadQueue.size === 0) {
                        document.getElementById('downloadQueue').classList.add('hidden');
                    }
                }
            }

            addToReceivedFiles(metadata) {
                const receivedFiles = document.getElementById('receivedFiles');
                
                // 清空初始提示
                if (receivedFiles.querySelector('.text-center')) {
                    receivedFiles.innerHTML = '';
                }
                
                const fileItem = document.createElement('div');
                fileItem.className = 'flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow';
                fileItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fa fa-file text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${metadata.filename}</div>
                            <div class="text-sm text-gray-500">${this.formatFileSize(metadata.size)} · ${new Date().toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="fts.downloadFile('${metadata.fileId}')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fa fa-download mr-1"></i>
                            下载
                        </button>
                        <button onclick="fts.deleteFile('${metadata.fileId}')" class="text-gray-400 hover:text-red-500 p-2">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                `;
                
                receivedFiles.insertBefore(fileItem, receivedFiles.firstChild);
            }

            async refreshFileSystem() {
                if (this.isConnected) {
                    this.sendMessage({
                        type: 'list_files'
                    });
                }
            }

            handleFileList(message) {
                this.currentFiles = message.files;
                this.renderFileSystem();
            }

            renderFileSystem() {
                const fileSystem = document.getElementById('fileSystem');
                fileSystem.innerHTML = '';
                
                this.currentFiles.forEach(file => {
                    const fileCard = document.createElement('div');
                    fileCard.className = 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer group';
                    fileCard.innerHTML = `
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fa fa-file text-blue-600 text-xl"></i>
                            </div>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="fts.showFileMenu(event, '${file.id}')" class="text-gray-400 hover:text-gray-600 p-1">
                                    <i class="fa fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                        <div class="font-medium text-gray-800 text-sm truncate" title="${file.name}">${file.name}</div>
                        <div class="text-xs text-gray-500 mt-1">${this.formatFileSize(file.size)}</div>
                    `;
                    
                    fileSystem.appendChild(fileCard);
                });
            }

            showFileMenu(event, fileId) {
                event.stopPropagation();
                // 这里可以实现右键菜单或更多操作
                this.showNotification('文件操作菜单', 'info');
            }

            downloadFile(fileId) {
                if (this.isConnected) {
                    this.sendMessage({
                        type: 'download_file',
                        fileId
                    });
                }
            }

            deleteFile(fileId) {
                if (confirm('确定要删除这个文件吗？')) {
                    if (this.isConnected) {
                        this.sendMessage({
                            type: 'delete_file',
                            fileId
                        });
                    }
                }
            }

            navigateParent() {
                if (this.isConnected) {
                    this.sendMessage({
                        type: 'navigate_parent'
                    });
                }
            }

            sendMessage(data) {
                if (this.isConnected && this.ws) {
                    try {
                        this.ws.send(JSON.stringify(data));
                    } catch (error) {
                        console.error('Failed to send message:', error);
                    }
                }
            }

            updateConnectionStatus() {
                const statusElement = document.getElementById('connectionStatus');
                const textElement = document.getElementById('connectionText');
                
                if (this.isConnected) {
                    statusElement.className = 'w-2 h-2 bg-green-400 rounded-full pulse-animation';
                    textElement.textContent = '已连接';
                    textElement.className = 'text-sm text-green-600';
                } else {
                    statusElement.className = 'w-2 h-2 bg-red-400 rounded-full';
                    textElement.textContent = '未连接';
                    textElement.className = 'text-sm text-red-600';
                }
            }

            updateUI() {
                const serverAddressInput = document.getElementById('serverAddress');
                const connectBtn = document.getElementById('connectBtn');
                
                if (this.role === 'server') {
                    serverAddressInput.placeholder = 'ws://localhost:8080';
                    connectBtn.textContent = '启动服务';
                    connectBtn.innerHTML = '<i class="fa fa-play mr-1"></i>启动服务';
                } else {
                    serverAddressInput.placeholder = 'ws://公网IP:端口';
                    connectBtn.textContent = '连接服务器';
                    connectBtn.innerHTML = '<i class="fa fa-connectdevelop mr-1"></i>连接服务器';
                }
            }

            showSettings() {
                document.getElementById('settingsModal').classList.remove('hidden');
                document.getElementById('settingsModal').classList.add('flex');
                
                // 加载当前设置
                document.getElementById('chunkSize').value = this.settings.chunkSize;
                document.getElementById('maxConcurrent').value = this.settings.maxConcurrent;
                document.getElementById('enableEncryption').checked = this.settings.enableEncryption;
            }

            hideSettings() {
                document.getElementById('settingsModal').classList.add('hidden');
                document.getElementById('settingsModal').classList.remove('flex');
            }

            saveSettings() {
                this.settings = {
                    chunkSize: parseInt(document.getElementById('chunkSize').value),
                    maxConcurrent: parseInt(document.getElementById('maxConcurrent').value),
                    enableEncryption: document.getElementById('enableEncryption').checked
                };
                
                localStorage.setItem('fileTransferSettings', JSON.stringify(this.settings));
                this.hideSettings();
                this.showNotification('设置已保存', 'success');
            }

            loadSettings() {
                const saved = localStorage.getItem('fileTransferSettings');
                if (saved) {
                    this.settings = { ...this.settings, ...JSON.parse(saved) };
                }
            }

            showNotification(content, level = 'info') {
                // 创建通知元素
                const notification = document.createElement('div');
                notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
                
                const colors = {
                    success: 'bg-green-500 text-white',
                    error: 'bg-red-500 text-white',
                    warning: 'bg-yellow-500 text-white',
                    info: 'bg-blue-500 text-white'
                };
                
                const icons = {
                    success: 'fa-check-circle',
                    error: 'fa-exclamation-circle',
                    warning: 'fa-exclamation-triangle',
                    info: 'fa-info-circle'
                };
                
                notification.className += ` ${colors[level]}`;
                notification.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fa ${icons[level]}"></i>
                        <span>${content}</span>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // 显示通知
                setTimeout(() => {
                    notification.classList.remove('translate-x-full');
                }, 100);
                
                // 自动隐藏
                setTimeout(() => {
                    notification.classList.add('translate-x-full');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }

            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            readFileAsArrayBuffer(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
            }

            generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            }
        }

        // 初始化系统
        let fts;
        document.addEventListener('DOMContentLoaded', () => {
            fts = new FileTransferSystem();
            window.fts = fts; // 暴露给全局以便在HTML中调用
        });

        // 右键菜单支持
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // 这里可以实现自定义右键菜单
        });
    
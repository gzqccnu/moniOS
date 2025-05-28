// 设置OSquery示例
function setOSQueryExample(query) {
    document.getElementById('osquery-input').value = query;
}

// 运行OSquery，添加防抖
let osqueryTimeout = null;
async function runOSQuery() {
    const query = document.getElementById('osquery-input').value.trim();
    const results = document.getElementById('osquery-results');
    
    if (!query) {
        results.textContent = '请输入查询语句';
        return;
    }
    
    // 处理特殊命令：.tables - 列出所有可用表
    if (query === '.tables') {
        displayTablesList(results);
        return;
    }
    
    // 显示正在执行
    results.textContent = '正在执行查询...';
    
    // 使用防抖避免频繁请求
    clearTimeout(osqueryTimeout);
    osqueryTimeout = setTimeout(async () => {
        try {
            // 调用API执行查询
            const data = await executeOSQuery(query);
            
            if (data.error) {
                results.textContent = `查询执行失败: ${data.error}`;
            } else {
                // 格式化结果，针对socket_events进行特殊处理
                if (query.toLowerCase().includes('socket_events')) {
                    formatSocketEventsResults(results, data);
                } else {
                    // 普通JSON格式化
                    results.textContent = JSON.stringify(data, null, 2);
                }
            }
        } catch (error) {
            console.error('执行查询时出错:', error);
            results.textContent = `执行查询时出错: ${error.message}`;
        }
    }, 300);
}

// 显示所有可用表格列表
function displayTablesList(container) {
    container.innerHTML = '';
    
    // OSQuery 表格列表
    const tables = [
        "acpi_tables", "apparmor_events", "apparmor_profiles", "apt_sources", "arp_cache", 
        "augeas", "authorized_keys", "azure_instance_metadata", "azure_instance_tags", 
        "block_devices", "bpf_process_events", "bpf_socket_events", "carbon_black_info", 
        "carves", "certificates", "chrome_extension_content_scripts", "chrome_extensions", 
        "cpu_info", "cpu_time", "crontab", "curl", "curl_certificate", "deb_packages", 
        "device_file", "device_hash", "device_partitions", "disk_encryption", "dns_resolvers", 
        "docker_container_envs", "docker_container_fs_changes", "docker_container_labels", 
        "docker_container_mounts", "docker_container_networks", "docker_container_ports", 
        "docker_container_processes", "docker_container_stats", "docker_containers", 
        "docker_image_history", "docker_image_labels", "docker_image_layers", "docker_images", 
        "docker_info", "docker_network_labels", "docker_networks", "docker_version", 
        "docker_volume_labels", "docker_volumes", "ec2_instance_metadata", "ec2_instance_tags", 
        "etc_hosts", "etc_protocols", "etc_services", "extended_attributes", "file", 
        "file_events", "firefox_addons", "groups", "hardware_events", "hash", "intel_me_info", 
        "interface_addresses", "interface_details", "interface_ipv6", "iptables", "kernel_info", 
        "kernel_keys", "kernel_modules", "known_hosts", "last", "listening_ports", "load_average", 
        "logged_in_users", "lxd_certificates", "lxd_cluster", "lxd_cluster_members", "lxd_images", 
        "lxd_instance_config", "lxd_instance_devices", "lxd_instances", "lxd_networks", 
        "lxd_storage_pools", "magic", "md_devices", "md_drives", "md_personalities", 
        "memory_array_mapped_addresses", "memory_arrays", "memory_device_mapped_addresses", 
        "memory_devices", "memory_error_info", "memory_info", "memory_map", "mounts", "msr", 
        "npm_packages", "oem_strings", "os_version", "osquery_events", "osquery_extensions", 
        "osquery_flags", "osquery_info", "osquery_packs", "osquery_registry", "osquery_schedule", 
        "pci_devices", "platform_info", "portage_keywords", "portage_packages", "portage_use", 
        "process_envs", "process_events", "process_file_events", "process_memory_map", 
        "process_namespaces", "process_open_files", "process_open_pipes", "process_open_sockets", 
        "processes", "prometheus_metrics", "python_packages", "routes", "rpm_package_files", 
        "rpm_packages", "seccomp_events", "secureboot", "selinux_events", "selinux_settings", 
        "shadow", "shared_memory", "shell_history", "smbios_tables", "socket_events", 
        "ssh_configs", "startup_items", "sudoers", "suid_bin", "syslog_events", "system_controls", 
        "system_info", "systemd_units", "time", "ulimit_info", "uptime", "usb_devices", 
        "user_events", "user_groups", "user_ssh_keys", "users", "vscode_extensions", "yara", 
        "yara_events", "ycloud_instance_metadata", "yum_sources"
    ];
    
    // 创建表格列表显示
    const tablesDiv = document.createElement('div');
    tablesDiv.style.columnCount = 3;
    tablesDiv.style.columnGap = '20px';
    tablesDiv.style.fontFamily = "'JetBrains Mono', monospace";
    tablesDiv.style.fontSize = '13px';
    tablesDiv.style.lineHeight = '1.6';
    
    tables.forEach(table => {
        const tableItem = document.createElement('div');
        tableItem.textContent = `=> ${table}`;
        tableItem.style.color = '#98c379';
        tableItem.style.cursor = 'pointer';
        tableItem.style.padding = '2px 0';
        
        // 添加点击事件，点击表名时自动填充对应的查询
        tableItem.addEventListener('click', () => {
            document.getElementById('osquery-input').value = `SELECT * FROM ${table} LIMIT 10;`;
        });
        
        tablesDiv.appendChild(tableItem);
    });
    
    // 创建标题和说明
    const header = document.createElement('div');
    header.textContent = 'OSQuery 可用表格列表:';
    header.style.fontSize = '16px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    header.style.color = '#61afef';
    
    const description = document.createElement('div');
    description.textContent = '点击表名可快速生成查询示例。';
    description.style.marginBottom = '15px';
    description.style.fontSize = '13px';
    description.style.color = '#abb2bf';
    
    // 添加到结果容器
    container.appendChild(header);
    container.appendChild(description);
    container.appendChild(tablesDiv);
}

// 格式化socket_events查询结果
function formatSocketEventsResults(container, data) {
    // 清空容器
    container.innerHTML = '';
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        container.textContent = '未找到socket事件数据';
        return;
    }
    
    // 创建结果表格
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';
    table.style.color = '#abb2bf';
    table.style.fontSize = '13px';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 获取所有列名
    const columns = Object.keys(data[0]);
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        th.style.textAlign = 'left';
        th.style.padding = '8px';
        th.style.borderBottom = '1px solid #444';
        th.style.color = '#61afef';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        columns.forEach(column => {
            const td = document.createElement('td');
            td.style.padding = '8px';
            td.style.borderBottom = '1px solid #333';
            
            // 为特定列添加样式
            if (column === 'action') {
                td.className = 'socket-event-action';
            } else if (column === 'process_name') {
                td.className = 'socket-event-process';
            } else if (column === 'remote_address' || column === 'local_address') {
                td.className = 'socket-event-address';
            } else if (column === 'time') {
                td.className = 'socket-event-time';
            }
            
            td.textContent = row[column] || 'N/A';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}
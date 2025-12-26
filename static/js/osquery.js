/*
Copyright (c) 2025 lrisguan. under Apache, GPL LICENCE
https://github.com/lrisguan/moniOS
*/

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
async function displayTablesList(container) {
  container.innerHTML = '';

  // 标题 + 说明
  const header = document.createElement('div');
  header.textContent = '可用表格列表:';
  header.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:10px;color:#61afef';
  const description = document.createElement('div');
  description.textContent = '点击表名可快速生成查询示例。';
  description.style.cssText = 'margin-bottom:15px;font-size:13px;color:#abb2bf';
  container.append(header, description);

  // 1) 发 POST 请求到 /api/osquery，query=".tables"
  let tables = [];
  try {
    const resp = await fetch('/api/osquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '.tables' })
    });
    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `HTTP ${resp.status}`);
    }
    if (data.error) {
      throw new Error(data.error);
    }

    // 2) 后端会把 .tables 的输出放在 data.text 里，逐行拆分并取 "=> xxx"
    const lines = (data.text || '').split('\n');
    tables = lines
      .map(l => l.trim())
      .filter(l => l.startsWith('=>'))
      .map(l => l.replace(/^=>\s*/, '').trim());

    if (!tables.length) {
      throw new Error('返回结果中未找到任何表名');
    }
  } catch (e) {
    container.innerHTML = `<div style="color:#e06c75">获取表列表失败：${e.message}</div>`;
    return;
  }

  // 3) 渲染成三列可点列表
  const tablesDiv = document.createElement('div');
  tablesDiv.style.cssText = [
    'column-count:3',
    'column-gap:20px',
    "font-family:'JetBrains Mono',monospace",
    'font-size:13px',
    'line-height:1.6',
  ].join(';');

  tables.forEach(table => {
    const item = document.createElement('div');
    item.textContent = `=> ${table}`;
    item.style.cssText = 'color:#98c379;cursor:pointer;padding:2px 0';
    item.addEventListener('click', () => {
      document.getElementById('osquery-input').value = `SELECT * FROM ${table} LIMIT 10;`;
    });
    tablesDiv.appendChild(item);
  });

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

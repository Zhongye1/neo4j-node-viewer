// 添加新函数用于检查数据库状态和节点数
async function updateDatabaseStatus() {
    const session = driver.session();
    try {
        // 获取数据库连接信息
        const dbInfo = await session.run("CALL dbms.components() YIELD name, version");
        const dbName = dbInfo.records[0].get('name');
        const dbVersion = dbInfo.records[0].get('version');
        
        // 获取节点总数
        const countResult = await session.run("MATCH (n:Node) RETURN count(n) as count");
        const nodeCount = countResult.records[0].get('count').toFixed(0);

        // 更新底栏信息
        const statusHtml = `
            <span class="db-status">
                <span class="status-item">
                    <span class="status-dot connected"></span>
                    数据库: ${dbName} ${dbVersion}
                </span>
                <span class="status-item">节点数: ${nodeCount}</span>
            </span>
        `;
        
        document.getElementById('db-status').innerHTML = statusHtml;
    } catch (error) {
        document.getElementById('db-status').innerHTML = `
            <span class="db-status">
                <span class="status-item">
                    <span class="status-dot disconnected"></span>
                    数据库连接失败
                </span>
            </span>
        `;
        console.error('数据库状态更新失败:', error);
    } finally {
        session.close();
    }
}

// 添加初始化函数调用
document.addEventListener('DOMContentLoaded', () => {
    updateDatabaseStatus();
    // 每60秒更新一次状态
    setInterval(updateDatabaseStatus, 60000);
});


function updateDatabaseStatus(dbInfo) {
    document.getElementById('db-name').textContent = dbInfo.database || '-';
    const statusIndicator = document.getElementById('connection-status');
    if (dbInfo.connected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
    }
}

function updateNodeCount(count) {
    document.getElementById('node-count').textContent = count;
}

// 在数据库连接成功后调用
function onDatabaseConnect(dbName) {
    updateDatabaseStatus({
        database: dbName,
        connected: true
    });
    
    // 查询总节点数
    const session = driver.session();
    session
        .run('MATCH (n) RETURN count(n) as count')
        .then(result => {
            const count = result.records[0].get('count').toNumber();
            updateNodeCount(count);
        })
        .catch(error => {
            console.error('Error getting node count:', error);
            updateNodeCount('Error');
        })
        .finally(() => {
            session.close();
        });
}
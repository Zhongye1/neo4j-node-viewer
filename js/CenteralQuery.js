async function runCentralityQuery() {
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (n:Node)
            RETURN 
                n.address AS Address,
                n.pagerank AS PageRank,
                n.degree_centrality AS DegreeCentrality,
                n.closeness_centrality AS ClosenessCentrality,
                n.betweenness_centrality AS BetweennessCentrality
            ORDER BY n.pagerank DESC`
        );

        if (result.records.length === 0) {
            alert('未找到节点');
            return;
        }

        const centralityData = result.records.map(record => ({
            Address: record.get('Address'),
            PageRank: record.get('PageRank'),
            DegreeCentrality: record.get('DegreeCentrality'),
            ClosenessCentrality: record.get('ClosenessCentrality'),
            BetweennessCentrality: record.get('BetweennessCentrality')
        }));

        // 为每种中心性指标创建前10排名
        const pageRankTop10 = [...centralityData]
            .sort((a, b) => b.PageRank - a.PageRank)
            .slice(0, 10);

        const degreeCentralityTop10 = [...centralityData]
            .sort((a, b) => b.DegreeCentrality - a.DegreeCentrality)
            .slice(0, 10);

        const closenessCentralityTop10 = [...centralityData]
            .sort((a, b) => b.ClosenessCentrality - a.ClosenessCentrality)
            .slice(0, 10);

        const betweennessCentralityTop10 = [...centralityData]
            .sort((a, b) => b.BetweennessCentrality - a.BetweennessCentrality)
            .slice(0, 10);

        // 增强的控制台输出
        console.group('中心度计算结果详细信息');
        
        console.group('数据统计');
        console.log('总节点数:', centralityData.length);
        console.log('PageRank范围:', {
            最小值: Math.min(...centralityData.map(d => d.PageRank)),
            最大值: Math.max(...centralityData.map(d => d.PageRank)),
            平均值: centralityData.reduce((sum, d) => sum + d.PageRank, 0) / centralityData.length
        });
        console.log('度中心性范围:', {
            最小值: Math.min(...centralityData.map(d => d.DegreeCentrality)),
            最大值: Math.max(...centralityData.map(d => d.DegreeCentrality)),
            平均值: centralityData.reduce((sum, d) => sum + d.DegreeCentrality, 0) / centralityData.length
        });
        console.log('接近中心性范围:', {
            最小值: Math.min(...centralityData.map(d => d.ClosenessCentrality)),
            最大值: Math.max(...centralityData.map(d => d.ClosenessCentrality)),
            平均值: centralityData.reduce((sum, d) => sum + d.ClosenessCentrality, 0) / centralityData.length
        });
        console.log('中介中心性范围:', {
            最小值: Math.min(...centralityData.map(d => d.BetweennessCentrality)),
            最大值: Math.max(...centralityData.map(d => d.BetweennessCentrality)),
            平均值: centralityData.reduce((sum, d) => sum + d.BetweennessCentrality, 0) / centralityData.length
        });
        console.groupEnd();

        console.group('完整数据');
        console.log('原始数据集:', centralityData);
        console.table(centralityData);
        console.groupEnd();
        
        console.group('PageRank Top 10详情');
        console.log('排序依据: PageRank值从高到低');
        console.table(pageRankTop10);
        console.groupEnd();
        
        console.group('度中心性 Top 10详情');
        console.log('排序依据: 度中心性值从高到低');
        console.table(degreeCentralityTop10);
        console.groupEnd();
        
        console.group('接近中心性 Top 10详情');
        console.log('排序依据: 接近中心性值从高到低');
        console.table(closenessCentralityTop10);
        console.groupEnd();
        
        console.group('中介中心性 Top 10详情');
        console.log('排序依据: 中介中心性值从高到低');
        console.table(betweennessCentralityTop10);
        console.groupEnd();
        
        console.groupEnd();

        // 生成HTML内容
        const sidebar2Content = document.getElementById('sidebar2');
        sidebar2Content.innerHTML = `
            <br><br><br>
            
            <div class="centrality-results">
            <h3>中心度计算结果</h3>
                <h4>PageRank</h4>
                ${generateRankingTable(pageRankTop10, 'PageRank')}
                
                <h4>DegreeCentrality (度中心性)</h4>
                ${generateRankingTable(degreeCentralityTop10, 'DegreeCentrality')}
                
                <h4>ClosenessCentrality (接近中心性)</h4>
                ${generateRankingTable(closenessCentralityTop10, 'ClosenessCentrality')}
                
                <h4>BetweennessCentrality (中介中心性)</h4>
                ${generateRankingTable(betweennessCentralityTop10, 'BetweennessCentrality')}
                更多信息见控制台(F12)
            </div>
        `;

    } catch (error) {
        console.error('中心度计算失败:', error);
        alert(`错误: ${error.message}`);
    } finally {
        session.close();
    }
}

function generateRankingTable(data, metric) {
    return `
    <table class="node-table">
        <tr>
            <th>排名</th>
            <th>节点地址</th>
            <th>PageRank</th>
            <th>度中心性</th>
            <th>接近中心性</th>
            <th>中介中心性</th>
        </tr>
        ${data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.Address || 'N/A'}</td>
                <td>${item.PageRank?.toFixed(6) || 'N/A'}</td>
                <td>${item.DegreeCentrality?.toFixed(6) || 'N/A'}</td>
                <td>${item.ClosenessCentrality?.toFixed(6) || 'N/A'}</td>
                <td>${item.BetweennessCentrality?.toFixed(6) || 'N/A'}</td>
            </tr>
        `).join('')}
    </table>`;
}


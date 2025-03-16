
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
            ORDER BY PageRank DESC`
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

        console.log(centralityData);
        alert('中心度计算完成，查看控制台以获取详细信息');
    } catch (error) {
        console.error('中心度计算失败:', error);
        alert(`错误: ${error.message}`);
    } finally {
        session.close();
    }
}
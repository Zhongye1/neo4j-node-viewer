        let neoViz;
        let driver;
        let maxDegree = 0;
        const customColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#9DC183", "#FF9F1C", "#9B59B6", "#34495E"];

        function init() {
            initDriver();
            draw();
        }

        function initDriver() {
            driver = neo4j.driver(
                "bolt://172.22.121.4:7687",
                neo4j.auth.basic("neo4j", "12345678") // 替换为实际密码
            );
        }

        async function fetchNodeDetails() {
            const input = document.getElementById('nodeQuery').value.trim();
            if (!input) return;

            const session = driver.session();
            try {
                const isID = input.startsWith('765b'); // 根据实际ID特征调整
                const cypher = isID 
                    ? `MATCH (n:Node {id: $input}) RETURN n`
                    : `MATCH (n:Node {address: $input}) RETURN n`;

                const result = await session.run(cypher, { input });
                
                if (result.records.length === 0) {
                    showNodeDetails("节点未找到");
                    return;
                }

                const node = result.records[0].get('n').properties;
                showNodeDetails(formatNodeDetails(node));
                
            } catch (error) {
                console.error("查询失败:", error);
                showNodeDetails(`错误: ${error.message}`);
            } finally {
                session.close();
            }
        }

        function formatNodeDetails(node) {
            return `
            <table class="node-table">
                <tr><th>属性</th><th>值</th></tr>
                <tr><td>id</td><td>${node.id}</td></tr>
                <tr><td>地址</td><td>${node.address || "N/A"}</td></tr>
                <tr><td>度数</td><td>${node.degree || "N/A"}</td></tr>
                <tr><td>TCP端口</td><td>${node.tcp_port || "N/A"}</td></tr>
                <tr><td>UDP端口</td><td>${node.udp_port || "N/A"}</td></tr>
                <tr><td>公钥</td><td>${formatPubkey(node.pubkey)}</td></tr>
                <tr><td>时间戳</td><td>${new Date(node.timestamp * 1000).toLocaleString()}</td></tr>
                
            </table>
            `;
        }

        function formatPubkey(pubkey) {
            if (!pubkey) return "N/A";
            return `<span class="pubkey" title="${pubkey}">${pubkey.substring(0, 24)}...</span>`;
        }

        function showNodeDetails(content) {
            document.getElementById('node-details').innerHTML = 
                `<div class="info-item">${content}</div>`;
        }

        

        async function runDegreeQuery() {
            const session = driver.session();
            try {
                const result = await session.run(
                    `MATCH (n:Node)
                    WHERE n.degree > 0  // 排除孤立节点
                    RETURN 
                        n.id AS nodeId, 
                        n.address AS address,
                        n.degree AS degree,
                        n.degree AS maxDegree
                    ORDER BY n.degree DESC
                    LIMIT 1`
                );
                
                if (result.records.length > 0) {
                    maxDegree = result.records[0].get('maxDegree') || 0;
                    const record = result.records[0];
                    updateSidebar(
                        `最高度数节点:<br>节点ID: ${record.get('nodeId')}<br>地址: ${record.get('address')}<br>连接数: ${Math.round(record.get('degree'))}`  // 度数转整数
                    );
                } else {
                    updateSidebar("未找到有效节点");
                }
            } catch (error) {
                console.error('查询失败:', error);
                updateSidebar("查询出错，请检查控制台");
            } finally {
                await session.close();
            }
        }

        function updateSidebar(content) {
            const sidebar = document.getElementById('sidebar-content');
            sidebar.innerHTML = `<div class="info-item">${content}</div>` + sidebar.innerHTML;
        }

        function draw() {
            const customColors = [
                "#D3F3FD", // 白蓝 (1-20)
                "#99E4FA", // 浅蓝 (21-40)
                "#99C3FA", // 深蓝 (41-60)
                "#FAA6E6", // 粉红色 (61-80)
              ];
            const config = {
                containerId: "viz",
                neo4j: { 
                    serverUrl: "bolt://172.22.121.4:7687",
                    serverUser: "neo4j",
                    serverPassword: "12345678" // 替换为实际密码
                },
                labels: {
                    Node: {
                        label: "address",       // 主标签显示IP地址[1](@ref)
                        value: "id",      // 次要标签展示TCP端口号[1](@ref)
                        size: "pagerank",
                        group: "degree",            // 按节点ID进行分组着色[1](@ref)
                        font: { size: 15, color: "#606266" },
                        [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
                            function: {
                                title: (node) => {  // 自定义悬浮框内容
                                    const props = node?.properties || {};
                                    return `节点属性：
                                        "id": ${props.id}
                                        "address"(地址): ${props.address || "N/A"}
                                        "degree"(度数): ${props.degree}
                                        "tcp_port"(TCP端口): ${props.tcp_port || "N/A"}
                                        "udp_port"(UDP端口): ${props.udp_port || "N/A"}
                                        "pubkey"(公钥): ${props.pubkey ? props.pubkey.substring(0, 64) + "..." : "N/A"}
                                        "timestamp"(时间戳): ${new Date(props.timestamp * 1000).toLocaleString()} 
                                    `; 
                                },
                                shape: () => "circle",  // 固定圆形节点形状[1](@ref)
                                // 修改颜色映射函数
                                color: (node) => {
                                    const degree = node.properties.degree || 0;

                                    // 最高度数节点判断
                                    if (degree === maxDegree) {
                                        return "#000000"; // 黑色
                                    }
                                    const binSize = 20;
                                    // 确保1-10对应第一个颜色，91-100对应最后一个颜色
                                    const index = Math.min(Math.floor((degree - 1) / binSize), customColors.length - 1);
                                    return customColors[Math.max(index, 0)]; // 处理degree=0的情况
                                }
                            }
                        }
                    }
                },
                relationships: {
                    "NEIGHBOR": {
                        thickness: "degree", // 关系线
                        caption: false, // 关系标签
                        color: () => "#808080" // 关系线颜色
                    }
                },
                visConfig: {
                    physics: {
                        stabilization: true, // 启用物理模拟
                        barnesHut: {
                            gravitationalConstant: -1911000, // 斥力强度
                            springLength: 20000000, // 连接线长度
                            springConstant: 0.02 // 弹性系数
                        }
                    },
                    interaction: {
                        hover: true, // 启用悬停效果
                        tooltipDelay: 200 // 悬停提示延迟
                    }
                },
                arrows: true, // 显示关系箭头
                hierarchical: false, // 禁用分层布局
                initialCypher: "MATCH (n)-[r]->(m) RETURN n, r, m" // 初始查询
            };

            neoViz = new NeoVis.default(config);
            neoViz.render();
        }

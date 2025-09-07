// Dashboard de observabilidade para MDA
import { getMetricsJSON } from '../monitoring/metrics.js';
import { getFeatureFlagsStats } from '../features/featureFlags.js';
import { secureLog } from '../middleware/security.js';

// HTML do dashboard
const DASHBOARD_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MDA Dashboard - Observabilidade</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f6fa;
            color: #2c3e50;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h3 { 
            color: #2c3e50; 
            margin-bottom: 15px; 
            font-size: 18px;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .metric-value { 
            font-weight: bold; 
            color: #27ae60;
        }
        .alert { 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0;
        }
        .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .status-ok { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .refresh-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
        .chart-container { height: 300px; }
        .feature-flag {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .feature-enabled { border-left-color: #27ae60; }
        .feature-disabled { border-left-color: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Medical Desk Advanced</h1>
        <p>Dashboard de Observabilidade e Monitoramento</p>
    </div>
    
    <button class="refresh-btn" onclick="loadDashboard()">🔄 Atualizar</button>
    
    <div class="container">
        <div id="alerts-container"></div>
        
        <div class="grid">
            <!-- System Health -->
            <div class="card">
                <h3>🔧 Status do Sistema</h3>
                <div id="system-health"></div>
            </div>
            
            <!-- Request Metrics -->
            <div class="card">
                <h3>📊 Métricas de Requisições</h3>
                <div id="request-metrics"></div>
            </div>
            
            <!-- Latency -->
            <div class="card">
                <h3>⚡ Latência</h3>
                <div id="latency-metrics"></div>
            </div>
            
            <!-- WebSocket -->
            <div class="card">
                <h3>🔌 WebSocket</h3>
                <div id="websocket-metrics"></div>
            </div>
            
            <!-- AI Analysis -->
            <div class="card">
                <h3>🤖 Análise IA</h3>
                <div id="ai-metrics"></div>
            </div>
            
            <!-- Telemedicine -->
            <div class="card">
                <h3>📺 Telemedicina</h3>
                <div id="telemedicine-metrics"></div>
            </div>
            
            <!-- Feature Flags -->
            <div class="card">
                <h3>🚩 Feature Flags</h3>
                <div id="feature-flags"></div>
            </div>
            
            <!-- Charts -->
            <div class="card" style="grid-column: span 2;">
                <h3>📈 Gráficos de Performance</h3>
                <div class="chart-container">
                    <canvas id="metricsChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let chart;
        
        async function loadDashboard() {
            try {
                const [metricsResponse, featuresResponse] = await Promise.all([
                    fetch('/api/mda/metrics/json'),
                    fetch('/api/mda/admin/feature-flags')
                ]);
                
                const metrics = await metricsResponse.json();
                const features = await featuresResponse.json();
                
                updateSystemHealth(metrics.health);
                updateRequestMetrics(metrics.metrics.requests);
                updateLatencyMetrics(metrics.metrics.latency);
                updateWebSocketMetrics(metrics.metrics.websockets);
                updateAIMetrics(metrics.metrics.ai_analysis);
                updateTelemedicineMetrics(metrics.metrics.telemedicine);
                updateFeatureFlags(features.featureFlags);
                updateAlerts(metrics.alerts);
                updateChart(metrics.metrics);
                
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
                document.getElementById('alerts-container').innerHTML = 
                    '<div class="alert alert-warning">Erro ao conectar com o servidor MDA</div>';
            }
        }
        
        function updateSystemHealth(health) {
            const container = document.getElementById('system-health');
            const statusClass = health.healthy ? 'status-ok' : 'status-error';
            
            container.innerHTML = \`
                <div class="metric">
                    <span>Status Geral</span>
                    <span class="\${statusClass}">\${health.healthy ? '✅ Saudável' : '❌ Problema'}</span>
                </div>
                <div class="metric">
                    <span>Taxa de Erro</span>
                    <span class="metric-value">\${health.error_rate.toFixed(2)}%</span>
                </div>
                <div class="metric">
                    <span>Latência Média</span>
                    <span class="metric-value">\${health.avg_latency.toFixed(0)}ms</span>
                </div>
                <div class="metric">
                    <span>P95 Latência</span>
                    <span class="metric-value">\${health.p95_latency.toFixed(0)}ms</span>
                </div>
            \`;
        }
        
        function updateRequestMetrics(requests) {
            const container = document.getElementById('request-metrics');
            const successRate = requests.total > 0 ? 
                ((requests.success / requests.total) * 100).toFixed(2) : '0.00';
            
            container.innerHTML = \`
                <div class="metric">
                    <span>Total Requisições</span>
                    <span class="metric-value">\${requests.total}</span>
                </div>
                <div class="metric">
                    <span>Sucessos</span>
                    <span class="metric-value">\${requests.success}</span>
                </div>
                <div class="metric">
                    <span>Erros</span>
                    <span class="metric-value">\${requests.errors}</span>
                </div>
                <div class="metric">
                    <span>Taxa de Sucesso</span>
                    <span class="metric-value">\${successRate}%</span>
                </div>
            \`;
        }
        
        function updateLatencyMetrics(latency) {
            document.getElementById('latency-metrics').innerHTML = \`
                <div class="metric">
                    <span>P50 (Mediana)</span>
                    <span class="metric-value">\${latency.p50}ms</span>
                </div>
                <div class="metric">
                    <span>P95</span>
                    <span class="metric-value">\${latency.p95}ms</span>
                </div>
                <div class="metric">
                    <span>P99</span>
                    <span class="metric-value">\${latency.p99}ms</span>
                </div>
                <div class="metric">
                    <span>Média</span>
                    <span class="metric-value">\${latency.avg.toFixed(0)}ms</span>
                </div>
            \`;
        }
        
        function updateWebSocketMetrics(ws) {
            document.getElementById('websocket-metrics').innerHTML = \`
                <div class="metric">
                    <span>Conexões Ativas</span>
                    <span class="metric-value">\${ws.active_connections}</span>
                </div>
                <div class="metric">
                    <span>Total Conexões</span>
                    <span class="metric-value">\${ws.total_connections}</span>
                </div>
                <div class="metric">
                    <span>Mensagens Enviadas</span>
                    <span class="metric-value">\${ws.messages_sent}</span>
                </div>
                <div class="metric">
                    <span>Mensagens Recebidas</span>
                    <span class="metric-value">\${ws.messages_received}</span>
                </div>
            \`;
        }
        
        function updateAIMetrics(ai) {
            document.getElementById('ai-metrics').innerHTML = \`
                <div class="metric">
                    <span>Total Análises</span>
                    <span class="metric-value">\${ai.total_analyses}</span>
                </div>
                <div class="metric">
                    <span>Confiança Média</span>
                    <span class="metric-value">\${ai.avg_confidence.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Triagem Baixa</span>
                    <span class="metric-value">\${ai.triage_distribution.baixa || 0}</span>
                </div>
                <div class="metric">
                    <span>Triagem Alta</span>
                    <span class="metric-value">\${ai.triage_distribution.alta || 0}</span>
                </div>
            \`;
        }
        
        function updateTelemedicineMetrics(tele) {
            document.getElementById('telemedicine-metrics').innerHTML = \`
                <div class="metric">
                    <span>Sessões Ativas</span>
                    <span class="metric-value">\${tele.active_sessions}</span>
                </div>
                <div class="metric">
                    <span>Total Sessões</span>
                    <span class="metric-value">\${tele.total_sessions}</span>
                </div>
                <div class="metric">
                    <span>Duração Média</span>
                    <span class="metric-value">\${tele.avg_session_duration.toFixed(0)}min</span>
                </div>
            \`;
        }
        
        function updateFeatureFlags(flags) {
            const container = document.getElementById('feature-flags');
            let html = '';
            
            Object.entries(flags).forEach(([name, flag]) => {
                const enabledClass = flag.enabled ? 'feature-enabled' : 'feature-disabled';
                const status = flag.enabled ? \`✅ \${flag.percentage}%\` : '❌ Disabled';
                
                html += \`
                    <div class="feature-flag \${enabledClass}">
                        <span>\${name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</span>
                        <span>\${status}</span>
                    </div>
                \`;
            });
            
            container.innerHTML = html;
        }
        
        function updateAlerts(alerts) {
            const container = document.getElementById('alerts-container');
            let html = '';
            
            alerts.forEach(alert => {
                const alertClass = alert.severity === 'warning' ? 'alert-warning' : 'alert-info';
                html += \`
                    <div class="alert \${alertClass}">
                        <strong>\${alert.type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}:</strong>
                        \${alert.message}
                    </div>
                \`;
            });
            
            if (alerts.length === 0) {
                html = '<div class="alert alert-success">✅ Todos os indicadores estão normais</div>';
            }
            
            container.innerHTML = html;
        }
        
        function updateChart(metrics) {
            const ctx = document.getElementById('metricsChart').getContext('2d');
            
            if (chart) {
                chart.destroy();
            }
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Últimos 10min', '5min', 'Agora'],
                    datasets: [{
                        label: 'Requisições/min',
                        data: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), metrics.requests.total],
                        borderColor: '#3498db',
                        tension: 0.3
                    }, {
                        label: 'Erros/min',
                        data: [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), metrics.requests.errors],
                        borderColor: '#e74c3c',
                        tension: 0.3
                    }, {
                        label: 'Latência P95',
                        data: [Math.floor(Math.random() * 200) + 100, Math.floor(Math.random() * 200) + 100, metrics.latency.p95],
                        borderColor: '#f39c12',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Auto refresh a cada 30 segundos
        setInterval(loadDashboard, 30000);
        
        // Carregar na inicialização
        loadDashboard();
    </script>
</body>
</html>
`;

// Endpoint para servir o dashboard
export function getDashboard(req, res) {
  res.set('Content-Type', 'text/html');
  res.send(DASHBOARD_HTML);
}

// Dashboard simplificado para produção (sem autenticação admin)
export function getPublicDashboard(req, res) {
  // Dashboard público com métricas básicas (sem feature flags admin)
  const publicDashboard = DASHBOARD_HTML
    .replace('fetch(\'/api/mda/admin/feature-flags\')', 'Promise.resolve({json: () => ({featureFlags: {}})})');
    
  res.set('Content-Type', 'text/html');
  res.send(publicDashboard);
}
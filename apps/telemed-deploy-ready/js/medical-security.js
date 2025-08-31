// Sistema de Segurança da Área Médica - TeleMed
// Proteção de URLs e controle de acesso

// URLs protegidas que requerem login médico
const URLsProtegidas = [
    '/doctor-dashboard',
    '/agenda-medico.html',
    '/estatisticas-medico.html',
    '/pagamentos-medicos.html',
    '/prescricoes.html',
    '/fila-pacientes-medico.html',
    '/historico-consultas.html',
    '/notificacoes.html',
    "/medico",
    '/agenda-do-dia.html'
];

// Função para verificar se o médico está logado
function isMedicoLogado() {
    const medicoData = localStorage.getItem('medico_logado');
    
    if (!medicoData) {
        console.log('🔒 Acesso negado: Nenhum médico logado');
        return false;
    }
    
    try {
        const medico = JSON.parse(medicoData);
        const loginTime = new Date(medico.loginTime);
        const now = new Date();
        const diffHours = (now - loginTime) / (1000 * 60 * 60);
        
        // Sessão expira em 24 horas
        if (diffHours > 24) {
            console.log('🔒 Acesso negado: Sessão expirada');
            localStorage.removeItem('medico_logado');
            return false;
        }
        
        console.log(`✅ Médico logado: ${medico.name} (${medico.crm})`);
        return true;
        
    } catch (error) {
        console.error('🔒 Erro ao verificar login médico:', error);
        localStorage.removeItem('medico_logado');
        return false;
    }
}

// Função para verificar acesso a URL específica
function verificarAcesso(url) {
    // Normalizar URL removendo parâmetros
    const cleanUrl = url.split('?')[0];
    
    // Verificar se a URL está na lista de protegidas
    const isProtected = URLsProtegidas.some(protectedUrl => 
        cleanUrl === protectedUrl || cleanUrl.endsWith(protectedUrl)
    );
    
    if (isProtected) {
        if (!isMedicoLogado()) {
            console.log(`🔒 Redirecionando para área médica: ${url}`);
            
            // Salvar URL de destino para redirecionamento após login
            localStorage.setItem('medical_redirect_after_login', url);
            
            // Redirecionar para área médica com parâmetro
            window.location.href = `/medico?redirect=${encodeURIComponent(url)}`;
            return false;
        }
    }
    
    return true;
}

// Função para interceptar navegação
function interceptarNavegacao() {
    // Interceptar cliques em links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href) {
            const url = new URL(link.href);
            if (url.origin === window.location.origin) {
                if (!verificarAcesso(url.pathname)) {
                    e.preventDefault();
                }
            }
        }
    });
    
    // Interceptar mudanças de estado (history API)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
        if (url && !verificarAcesso(url)) {
            return;
        }
        return originalPushState.apply(history, arguments);
    };
    
    history.replaceState = function(state, title, url) {
        if (url && !verificarAcesso(url)) {
            return;
        }
        return originalReplaceState.apply(history, arguments);
    };
    
    // Interceptar evento popstate (botão voltar/avançar)
    window.addEventListener('popstate', function(e) {
        verificarAcesso(window.location.pathname);
    });
}

// Função para verificar acesso na página atual
function verificarPaginaAtual() {
    const currentPath = window.location.pathname;
    
    if (!verificarAcesso(currentPath)) {
        // A página será redirecionada pela função verificarAcesso
        return false;
    }
    
    return true;
}

// Função para logout médico
function logoutMedico() {
    localStorage.removeItem('medico_logado');
    localStorage.removeItem('medical_redirect_after_login');
    
    console.log('🔓 Logout realizado com sucesso');
    
    // Redirecionar para área médica
    window.location.href = '/medico';
}

// Função para obter dados do médico logado
function getMedicoLogado() {
    const medicoData = localStorage.getItem('medico_logado');
    
    if (!medicoData) {
        return null;
    }
    
    try {
        return JSON.parse(medicoData);
    } catch (error) {
        console.error('Erro ao obter dados do médico:', error);
        return null;
    }
}

// Função para atualizar timestamp de atividade
function atualizarAtividade() {
    const medicoData = localStorage.getItem('medico_logado');
    
    if (medicoData) {
        try {
            const medico = JSON.parse(medicoData);
            medico.lastActivity = new Date().toISOString();
            localStorage.setItem('medico_logado', JSON.stringify(medico));
        } catch (error) {
            console.error('Erro ao atualizar atividade:', error);
        }
    }
}

// Monitoramento de tentativas de acesso não autorizado
function monitorarAcessoNaoAutorizado() {
    let tentativasNegadas = parseInt(localStorage.getItem('access_denied_attempts') || '0');
    
    if (tentativasNegadas > 0) {
        console.warn(`⚠️ ${tentativasNegadas} tentativas de acesso não autorizado detectadas`);
        
        // Log para auditoria (em produção, enviaria para servidor)
        const logEntry = {
            timestamp: new Date().toISOString(),
            attempts: tentativasNegadas,
            userAgent: navigator.userAgent,
            ip: 'client-side', // Em produção, obteria do servidor
            url: window.location.href
        };
        
        console.log('📊 Log de segurança:', logEntry);
    }
}

// Registrar tentativa de acesso negado
function registrarAcessoNegado() {
    let tentativas = parseInt(localStorage.getItem('access_denied_attempts') || '0');
    tentativas++;
    localStorage.setItem('access_denied_attempts', tentativas.toString());
    
    console.warn(`🚨 Tentativa de acesso não autorizado registrada (#${tentativas})`);
}

// Inicialização do sistema de segurança
function inicializarSegurancaMedica() {
    console.log('🛡️ Sistema de Segurança Médica inicializado');
    
    // Verificar página atual
    if (!verificarPaginaAtual()) {
        registrarAcessoNegado();
        return;
    }
    
    // Configurar interceptação de navegação
    interceptarNavegacao();
    
    // Monitorar tentativas não autorizadas
    monitorarAcessoNaoAutorizado();
    
    // Atualizar atividade a cada 5 minutos
    setInterval(atualizarAtividade, 5 * 60 * 1000);
    
    // Atualizar atividade em eventos de interação
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
        document.addEventListener(eventType, atualizarAtividade, { passive: true });
    });
    
    console.log('✅ Sistema de segurança ativo e monitorando');
}

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSegurancaMedica);
} else {
    inicializarSegurancaMedica();
}

// Exportar funções para uso global
window.MedicalSecurity = {
    isMedicoLogado,
    verificarAcesso,
    logoutMedico,
    getMedicoLogado,
    registrarAcessoNegado,
    URLsProtegidas
};
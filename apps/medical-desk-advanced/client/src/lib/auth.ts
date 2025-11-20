/**
 * TeleMed JWT Authentication Manager
 * 
 * Extrai token da URL, armazena e injeta em todas as requisições
 * Compatível com contrato JWT do TeleMed:
 *  - iss: "telemed"
 *  - claims: sub, role, patientId, user, crm, name
 */

const TOKEN_STORAGE_KEY = 'mda_jwt_token';
const TOKEN_TIMESTAMP_KEY = 'mda_jwt_timestamp';

export interface TokenInfo {
  token: string;
  timestamp: number;
}

/**
 * Extrai token JWT da URL (?token=...) e opcionalmente limpa da URL
 */
export function getTokenFromUrl(clearUrl: boolean = false): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token && clearUrl) {
      // Limpa token da URL (segurança)
      urlParams.delete('token');
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + 
                     (newSearch ? '?' + newSearch : '') + 
                     window.location.hash;
      window.history.replaceState({}, '', newUrl);
      console.log('[Auth] Token removido da URL');
    }
    
    return token;
  } catch (error) {
    console.warn('[Auth] Erro ao extrair token da URL:', error);
    return null;
  }
}

/**
 * Salva token no localStorage
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
    console.log('[Auth] Token salvo com sucesso');
  } catch (error) {
    console.warn('[Auth] Erro ao salvar token:', error);
  }
}

/**
 * Recupera token do localStorage
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('[Auth] Erro ao recuperar token:', error);
    return null;
  }
}

/**
 * Remove token do localStorage (logout/expiração)
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    console.log('[Auth] Token removido');
  } catch (error) {
    console.warn('[Auth] Erro ao remover token:', error);
  }
}

/**
 * Obtém token atual (URL ou localStorage)
 */
export function getCurrentToken(): string | null {
  // Prioridade: URL > localStorage
  const urlToken = getTokenFromUrl(true); // true = limpa da URL após extrair
  if (urlToken) {
    saveToken(urlToken);
    return urlToken;
  }
  
  return getStoredToken();
}

/**
 * Decodifica payload JWT (sem validação - apenas para debug)
 */
export function decodeTokenPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('[Auth] Erro ao decodificar token:', error);
    return null;
  }
}

/**
 * Verifica se token está expirado (cliente-side, apenas heurística)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) {
      return false; // Sem exp, assume válido
    }
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém informações do usuário do token (cliente-side)
 */
export function getUserFromToken(token: string): {
  sub?: string;
  role?: string;
  name?: string;
  crm?: string;
} | null {
  try {
    const payload = decodeTokenPayload(token);
    if (!payload) {
      return null;
    }
    
    return {
      sub: payload.sub || payload.user,
      role: payload.role,
      name: payload.name,
      crm: payload.crm
    };
  } catch (error) {
    return null;
  }
}

/**
 * Inicializa sistema de autenticação
 * Chamado no bootstrap da aplicação
 */
export function initializeAuth(): void {
  const token = getCurrentToken();
  
  if (token) {
    const user = getUserFromToken(token);
    const isExpired = isTokenExpired(token);
    
    console.log('[Auth] Token encontrado:', {
      user: user?.sub || user?.name || 'unknown',
      role: user?.role || 'unknown',
      expired: isExpired
    });
    
    if (isExpired) {
      console.warn('[Auth] Token expirado detectado');
      clearToken();
    }
  } else {
    console.log('[Auth] Nenhum token encontrado (modo público)');
  }
}

/**
 * Instala interceptor global de fetch
 * Injeta header Authorization em todas as requisições
 */
export function installFetchInterceptor(): void {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getCurrentToken();
    
    // Apenas adiciona header se houver token
    if (token) {
      const headers = new Headers(init?.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      
      init = {
        ...init,
        headers
      };
    }
    
    try {
      const response = await originalFetch(input, init);
      
      // Tratamento de erros de autenticação
      if (response.status === 401 || response.status === 403) {
        console.error('[Auth] Erro de autenticação:', {
          status: response.status,
          url: typeof input === 'string' ? input : input.toString()
        });
        
        // Tentar extrair mensagem do servidor
        try {
          const errorData = await response.clone().json();
          if (errorData.code === 'TOKEN_EXPIRED') {
            clearToken();
            console.warn('[Auth] Token expirado - removido do localStorage');
            
            // Emitir evento customizado para UI reagir
            window.dispatchEvent(new CustomEvent('auth:token-expired', {
              detail: { message: errorData.message }
            }));
          }
        } catch (e) {
          // Ignorar se não for JSON
        }
      }
      
      return response;
    } catch (error) {
      console.error('[Auth] Erro na requisição:', error);
      throw error;
    }
  };
  
  console.log('[Auth] Interceptor de fetch instalado');
}

/**
 * Bootstrap completo do sistema de autenticação
 */
export function setupAuth(): void {
  initializeAuth();
  installFetchInterceptor();
}

/**
 * TeleMed WebRTC Metrics Collector
 * Captura métricas de conexão e envia para servidor
 */

class WebRTCMetrics {
  constructor() {
    this.metrics = [];
    this.sampleInterval = 5000; // 5 segundos
    this.batchSize = 10;
    this.isCollecting = false;
  }
  
  /**
   * Iniciar coleta de métricas
   */
  startCollection(peerConnection) {
    if (!peerConnection || this.isCollecting) return;
    
    this.isCollecting = true;
    this.pc = peerConnection;
    
    console.log('📊 Iniciando coleta de métricas WebRTC');
    
    // Coletar métricas periodicamente
    this.intervalId = setInterval(() => {
      this.collectStats();
    }, this.sampleInterval);
    
    // Parar quando conexão fechar
    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'closed' || 
          peerConnection.connectionState === 'failed') {
        this.stopCollection();
      }
    });
  }
  
  /**
   * Parar coleta
   */
  stopCollection() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isCollecting = false;
    
    // Enviar métricas finais
    if (this.metrics.length > 0) {
      this.sendMetrics();
    }
    
    console.log('🛑 Coleta de métricas WebRTC parada');
  }
  
  /**
   * Coletar estatísticas da conexão
   */
  async collectStats() {
    if (!this.pc) return;
    
    try {
      const stats = await this.pc.getStats();
      const timestamp = Date.now();
      
      let audioStats = null;
      let videoStats = null;
      let connectionStats = null;
      
      stats.forEach(report => {
        switch (report.type) {
          case 'inbound-rtp':
            if (report.mediaType === 'audio') {
              audioStats = this.extractAudioMetrics(report);
            } else if (report.mediaType === 'video') {
              videoStats = this.extractVideoMetrics(report);
            }
            break;
            
          case 'candidate-pair':
            if (report.state === 'succeeded') {
              connectionStats = this.extractConnectionMetrics(report);
            }
            break;
        }
      });
      
      const metric = {
        timestamp,
        session_id: this.getSessionId(),
        audio: audioStats,
        video: videoStats,
        connection: connectionStats
      };
      
      this.metrics.push(metric);
      
      // Enviar em batches
      if (this.metrics.length >= this.batchSize) {
        this.sendMetrics();
      }
      
    } catch (error) {
      console.warn('Erro ao coletar métricas WebRTC:', error.message);
    }
  }
  
  /**
   * Extrair métricas de áudio
   */
  extractAudioMetrics(report) {
    return {
      packets_received: report.packetsReceived || 0,
      packets_lost: report.packetsLost || 0,
      jitter: report.jitter || 0,
      audio_level: report.audioLevel || 0
    };
  }
  
  /**
   * Extrair métricas de vídeo
   */
  extractVideoMetrics(report) {
    return {
      packets_received: report.packetsReceived || 0,
      packets_lost: report.packetsLost || 0,
      frames_received: report.framesReceived || 0,
      frames_dropped: report.framesDropped || 0,
      frame_width: report.frameWidth || 0,
      frame_height: report.frameHeight || 0
    };
  }
  
  /**
   * Extrair métricas de conexão
   */
  extractConnectionMetrics(report) {
    return {
      rtt: report.currentRoundTripTime || 0,
      bytes_sent: report.bytesSent || 0,
      bytes_received: report.bytesReceived || 0,
      available_outgoing_bitrate: report.availableOutgoingBitrate || 0
    };
  }
  
  /**
   * Obter ID da sessão
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `webrtc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }
  
  /**
   * Enviar métricas para servidor
   */
  async sendMetrics() {
    if (this.metrics.length === 0) return;
    
    const payload = {
      metrics: this.metrics.splice(0), // Limpar array
      user_agent: navigator.userAgent.substring(0, 100),
      timestamp: Date.now()
    };
    
    try {
      // Usar mesmo padrão do audit-logger para determinar URL
      const baseUrl = window.location.hostname.includes('onrender.com') 
        ? 'https://telemed-gateway.onrender.com'
        : null;
        
      if (!baseUrl) {
        console.log('📊 WebRTC metrics não enviadas (desenvolvimento)');
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/webrtc-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`📊 ${payload.metrics.length} métricas WebRTC enviadas`);
      } else {
        console.warn('Falha ao enviar métricas WebRTC:', response.status);
      }
      
    } catch (error) {
      console.warn('Erro ao enviar métricas WebRTC:', error.message);
      // Recolocar métricas na fila se falhar
      this.metrics.unshift(...payload.metrics);
    }
  }
  
  /**
   * Obter estatísticas agregadas da sessão
   */
  getAggregatedStats() {
    if (this.metrics.length === 0) return null;
    
    const audioPacketsLost = this.metrics
      .filter(m => m.audio)
      .reduce((sum, m) => sum + (m.audio.packets_lost || 0), 0);
      
    const videoFramesDropped = this.metrics
      .filter(m => m.video)
      .reduce((sum, m) => sum + (m.video.frames_dropped || 0), 0);
      
    const avgRTT = this.metrics
      .filter(m => m.connection && m.connection.rtt > 0)
      .reduce((sum, m, _, arr) => sum + m.connection.rtt / arr.length, 0);
    
    return {
      session_id: this.getSessionId(),
      total_samples: this.metrics.length,
      audio_packets_lost: audioPacketsLost,
      video_frames_dropped: videoFramesDropped,
      avg_rtt_ms: Math.round(avgRTT * 1000),
      quality_score: this.calculateQualityScore(audioPacketsLost, videoFramesDropped, avgRTT)
    };
  }
  
  /**
   * Calcular score de qualidade (0-100)
   */
  calculateQualityScore(audioLoss, videoDrops, rtt) {
    let score = 100;
    
    // Penalizar perda de pacotes de áudio
    if (audioLoss > 0) score -= Math.min(audioLoss * 2, 30);
    
    // Penalizar frames de vídeo perdidos
    if (videoDrops > 0) score -= Math.min(videoDrops * 0.5, 25);
    
    // Penalizar RTT alto
    if (rtt > 0.1) score -= Math.min((rtt - 0.1) * 200, 25);
    
    return Math.max(0, Math.round(score));
  }
}

// Disponibilizar globalmente
window.WebRTCMetrics = WebRTCMetrics;

// Auto-inicializar quando WebRTC for detectado
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 WebRTC Metrics Collector carregado');
});
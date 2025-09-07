// WebSocket para tempo real - será exposto como /ws-mda via gateway
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const { JWT_PUBLIC_KEY_PEM } = process.env;

export function createWSServer(server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    clientTracking: true
  });

  // Contador de conexões ativas
  let activeConnections = 0;

  wss.on('connection', (ws, req) => {
    activeConnections++;
    console.log(`[MDA-WS] Nova conexão. Total: ${activeConnections}`);

    // Validar JWT do query param ou header
    const token = new URL(req.url, 'http://localhost').searchParams.get('token') ||
                  req.headers['sec-websocket-protocol'];

    let user = null;
    
    if (token && JWT_PUBLIC_KEY_PEM) {
      try {
        user = jwt.verify(token, JWT_PUBLIC_KEY_PEM, {
          algorithms: ["RS256"],
          audience: "telemed",
          issuer: "telemed-auth"
        });
      } catch (err) {
        console.log('[MDA-WS] Token inválido:', err.message);
      }
    }

    // Saudação inicial
    ws.send(JSON.stringify({ 
      type: 'hello', 
      service: 'medical-desk-advanced',
      userId: user?.sub || 'anonymous',
      ts: new Date().toISOString()
    }));

    // Handlers de mensagens
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleMessage(ws, message, user);
      } catch (err) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Formato de mensagem inválido',
          ts: new Date().toISOString()
        }));
      }
    });

    ws.on('close', () => {
      activeConnections--;
      console.log(`[MDA-WS] Conexão fechada. Total: ${activeConnections}`);
    });

    ws.on('error', (err) => {
      console.error('[MDA-WS] Erro na conexão:', err);
      activeConnections--;
    });
  });

  return wss;
}

function handleMessage(ws, message, user) {
  const { type, data } = message;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ 
        type: 'pong', 
        data: data,
        ts: new Date().toISOString()
      }));
      break;

    case 'join-consultation':
      if (!user) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Autenticação necessária para entrar em consulta',
          ts: new Date().toISOString()
        }));
        return;
      }
      
      const { consultationId } = data;
      ws.consultationId = consultationId;
      ws.send(JSON.stringify({
        type: 'consultation-joined',
        consultationId,
        userId: user.sub,
        ts: new Date().toISOString()
      }));
      break;

    case 'consultation-status':
      // Broadcast status para outros participantes da consulta
      if (ws.consultationId) {
        broadcast(ws, {
          type: 'consultation-status-update',
          consultationId: ws.consultationId,
          status: data.status,
          from: user?.sub || 'anonymous',
          ts: new Date().toISOString()
        });
      }
      break;

    case 'vital-signs':
      // Envio de sinais vitais em tempo real
      if (ws.consultationId) {
        broadcast(ws, {
          type: 'vital-signs-update',
          consultationId: ws.consultationId,
          vitalSigns: data,
          from: user?.sub || 'anonymous',
          ts: new Date().toISOString()
        });
      }
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Tipo de mensagem não suportado: ${type}`,
        ts: new Date().toISOString()
      }));
  }
}

function broadcast(senderWs, message) {
  const wss = senderWs._socket.server._wss;
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client !== senderWs && 
        client.readyState === 1 && 
        client.consultationId === senderWs.consultationId) {
      client.send(JSON.stringify(message));
    }
  });
}
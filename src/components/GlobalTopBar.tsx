import React from 'react';
// Import relativo (não depende de alias "@")
import { DrAIBadge } from '../features/dr-ai/DrAI';

export default function GlobalTopBar() {
  return (
    <div className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-50" style={{borderBottom:'1px solid #eee'}}>
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">TeleMed Hub</div>
        <DrAIBadge />
      </div>
    </div>
  );
}

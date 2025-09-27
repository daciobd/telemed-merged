import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PHRDoc24 from '@/views/phr/PHRIndex';

function RegistroSaudeRedirect() {
  const sp = new URLSearchParams(window.location.search);
  const id = (sp.get('patientId') || sp.get('id') || '').replace(/\D/g,'');
  return id ? <Navigate to={`/phr/${id}`} replace /> : <Navigate to="/meus-pacientes" replace />;
}

export default function PHRRoutes() {
  return (
    <Routes>
      <Route path='/phr' element={<PHRDoc24/>}/>
      <Route path='/phr/:id' element={<PHRDoc24/>}/>
      <Route path='/registro-saude' element={<RegistroSaudeRedirect />}/>
    </Routes>
  );
}
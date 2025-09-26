import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PHRDoc24 from '@/views/phr/PHRIndex';

function RegistroSaudeRedirect() {
  const loc = useLocation();
  const sp = new URLSearchParams(loc.search);
  const rawId = sp.get("patientId") || sp.get("id") || "";
  // Limpar ID (compatibilidade com IDs que podem ter formatação)
  const id = rawId.replace(/\D/g, "");
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
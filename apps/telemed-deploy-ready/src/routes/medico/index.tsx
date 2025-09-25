import { Routes, Route } from 'react-router-dom';
import MeusPacientesDoc24 from '@/views/medico/MeusPacientes';

export default function MedicoRoutes() {
  return (
    <Routes>
      <Route path='/meus-pacientes' element={<MeusPacientesDoc24/>}/>
    </Routes>
  );
}
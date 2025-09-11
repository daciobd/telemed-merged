import { Routes, Route } from "react-router-dom";
import PacienteComoFunciona from './views/paciente/ComoFunciona';
import PacienteCadastroSucesso from './views/paciente/CadastroSucesso';
import PacientePedido from './views/paciente/Pedido';
import MedicoComoFunciona from './views/medico/ComoFunciona';
import ConsultaSala from './views/consulta/Sala';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/paciente/como-funciona" element={<PacienteComoFunciona />} />
      <Route path="/paciente/cadastro/sucesso" element={<PacienteCadastroSucesso />} />
      <Route path="/paciente/pedido" element={<PacientePedido />} />
      <Route path="/medico/como-funciona" element={<MedicoComoFunciona />} />
      <Route path="/consulta/sala" element={<ConsultaSala />} />
    </Routes>
  );
}
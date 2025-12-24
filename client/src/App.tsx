import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import RegisterDoctor from './pages/RegisterDoctor';
import PatientDashboard from './pages/PatientDashboard';
import PatientDoctorProfile from './pages/PatientDoctorProfile';
import PatientDoctorScheduling from './pages/PatientDoctorScheduling';
import PatientPhrDemo from './pages/PatientPhrDemo';
import PatientDoctorsPage from './pages/PatientDoctorsPage';
import PatientRequestsPage from './pages/PatientRequestsPage';
import PatientConsultationsPage from './pages/PatientConsultationsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import Marketplace from './pages/Marketplace';
import MinhasConsultas from './pages/MinhasConsultas';
import ConsultaDetails from './pages/ConsultaDetails';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import ManagerDashboard from './pages/ManagerDashboard';
import PendenciasUnsigned from './pages/PendenciasUnsigned';

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Auth routes - paths are relative to base="/consultorio" */}
      {/* Login: sempre mostra o componente, redirect é feito pelo Login.tsx após autenticar */}
      <Route path="/login" component={Login} />
      <Route path="/register/patient">
        {user ? <Redirect to="/paciente/dashboard" /> : <RegisterPatient />}
      </Route>
      <Route path="/register/doctor">
        {user ? <Redirect to="/dashboard" /> : <RegisterDoctor />}
      </Route>
      
      {/* Patient Dashboard DEMO - public route for presentations */}
      <Route path="/paciente/dashboard-demo" component={PatientDashboard} />
      
      {/* Patient pages - Doctor profile, Scheduling, PHR and lists (public for demo) */}
      <Route path="/paciente/medicos/:id" component={PatientDoctorProfile} />
      <Route path="/paciente/agendar/:id" component={PatientDoctorScheduling} />
      <Route path="/paciente/phr" component={PatientPhrDemo} />
      <Route path="/paciente/medicos" component={PatientDoctorsPage} />
      <Route path="/paciente/pedidos" component={PatientRequestsPage} />
      <Route path="/paciente/consultas" component={PatientConsultationsPage} />
      
      {/* Doctor Consulta details - public for demo mode */}
      <Route path="/consultas/:id" component={ConsultaDetails} />
      
      {/* Patient Dashboard - EXCLUSIVE route for patients */}
      <Route path="/paciente/dashboard">
        <ProtectedRoute component={PatientDashboard} />
      </Route>
      
      {/* Doctor Dashboard - /dashboard is EXCLUSIVELY for doctors */}
      <Route path="/dashboard">
        <ProtectedRoute component={DoctorDashboard} />
      </Route>
      
      {/* Protected routes */}
      <Route path="/marketplace/:id">
        <ProtectedRoute component={ConsultaDetails} />
      </Route>
      <Route path="/marketplace">
        <ProtectedRoute component={Marketplace} />
      </Route>
      <Route path="/minhas-consultas">
        <ProtectedRoute component={MinhasConsultas} />
      </Route>
      <Route path="/agenda">
        <ProtectedRoute component={Agenda} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      {/* Manager Dashboard - public for demo */}
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/pendencias" component={PendenciasUnsigned} />
      
      {/* Default redirect */}
      <Route path="/">
        <Redirect to={user ? (user.role === 'patient' ? "/paciente/dashboard" : "/dashboard") : "/login"} />
      </Route>
    </Switch>
  );
}

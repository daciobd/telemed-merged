import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import RegisterDoctor from './pages/RegisterDoctor';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PublicOfficePage from './pages/PublicOfficePage';
import Marketplace from './pages/Marketplace';
import MinhasConsultas from './pages/MinhasConsultas';
import ConsultaDetails from './pages/ConsultaDetails';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';

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

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  } else if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  return <Redirect to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public pages */}
      <Route path="/dr/:customUrl" component={PublicOfficePage} />
      
      {/* Auth routes */}
      <Route path="/consultorio/login">
        {user ? <Redirect to="/consultorio/dashboard" /> : <Login />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/register/patient">
        {user ? <Redirect to="/dashboard" /> : <RegisterPatient />}
      </Route>
      <Route path="/register/doctor">
        {user ? <Redirect to="/dashboard" /> : <RegisterDoctor />}
      </Route>
      
      {/* Consultório Virtual routes (with /consultorio prefix) */}
      <Route path="/consultorio/paciente/dashboard">
        <ProtectedRoute component={PatientDashboard} />
      </Route>
      <Route path="/consultorio/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>
      <Route path="/consultorio/marketplace">
        <ProtectedRoute component={Marketplace} />
      </Route>
      <Route path="/consultorio/marketplace/:id">
        <ProtectedRoute component={ConsultaDetails} />
      </Route>
      <Route path="/consultorio/minhas-consultas">
        <ProtectedRoute component={MinhasConsultas} />
      </Route>
      <Route path="/consultorio/consultas/:id">
        <ProtectedRoute component={ConsultaDetails} />
      </Route>
      <Route path="/consultorio/agenda">
        <ProtectedRoute component={Agenda} />
      </Route>
      <Route path="/consultorio/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      {/* Legacy routes (without /consultorio prefix) */}
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>
      <Route path="/marketplace">
        <ProtectedRoute component={Marketplace} />
      </Route>
      <Route path="/marketplace/:id">
        <ProtectedRoute component={ConsultaDetails} />
      </Route>
      <Route path="/minhas-consultas">
        <ProtectedRoute component={MinhasConsultas} />
      </Route>
      <Route path="/consultas/:id">
        <ProtectedRoute component={ConsultaDetails} />
      </Route>
      <Route path="/agenda">
        <ProtectedRoute component={Agenda} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      {/* Default redirect */}
      <Route path="/">
        <Redirect to={user ? "/dashboard" : "/login"} />
      </Route>
    </Switch>
  );
}

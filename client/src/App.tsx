import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import RegisterDoctor from './pages/RegisterDoctor';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
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

export default function App() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Auth routes - paths are relative to base="/consultorio" */}
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/register/patient">
        {user ? <Redirect to="/paciente/dashboard" /> : <RegisterPatient />}
      </Route>
      <Route path="/register/doctor">
        {user ? <Redirect to="/dashboard" /> : <RegisterDoctor />}
      </Route>
      
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

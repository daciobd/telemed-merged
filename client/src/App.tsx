import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import RegisterDoctor from './pages/RegisterDoctor';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

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
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/register/patient">
        {user ? <Redirect to="/dashboard" /> : <RegisterPatient />}
      </Route>
      <Route path="/register/doctor">
        {user ? <Redirect to="/dashboard" /> : <RegisterDoctor />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>
      <Route path="/">
        <Redirect to={user ? "/dashboard" : "/login"} />
      </Route>
    </Switch>
  );
}

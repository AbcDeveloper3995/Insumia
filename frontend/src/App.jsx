import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Inventario } from './pages/Inventario';
import { Recetas } from './pages/Recetas';
import { PuntoVenta } from './pages/PuntoVenta';
import { Informes } from './pages/Informes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/ventas" element={<PuntoVenta />} />
          <Route path="/informes" element={<Informes />} />
        </Route>

        {/* Ruta por defecto o 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

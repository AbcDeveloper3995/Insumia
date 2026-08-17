import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Inventario } from './pages/Inventario';
import { Recetas } from './pages/Recetas';
import { PuntoVenta } from './pages/PuntoVenta';
import { Informes } from './pages/Informes';
import { Finanzas } from './pages/Finanzas';
import { Compras } from './pages/Compras';
import { SeleccionRestaurante } from './pages/SeleccionRestaurante';
import { TourProvider } from './context/TourContext';

function App() {
  return (
    <TourProvider>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontWeight: '500' } }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seleccionar-restaurante" element={<SeleccionRestaurante />} />
        
        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/ventas" element={<PuntoVenta />} />
          <Route path="/informes" element={<Informes />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/compras" element={<Compras />} />
        </Route>

        {/* Ruta por defecto o 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </TourProvider>
  );
}

export default App;

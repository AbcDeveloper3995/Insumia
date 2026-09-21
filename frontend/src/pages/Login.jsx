import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth/authService';
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Columna Izquierda con Imagen */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-100">
        <img 
          src="/img/insumia1.jpeg" 
          alt="Restaurante" 
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
        {/* Un gradiente mucho más suave y neutro solo para que el texto se lea */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-md">
            Gestión inteligente<br/>para tu negocio gastronómico.
          </h2>
          <p className="text-slate-100 text-lg max-w-md font-medium drop-shadow-md">
            Controla tus ventas, inventario y recetas desde un solo lugar. Optimiza tus procesos y aumenta tus ganancias con Insumia.
          </p>
        </div>
      </div>

      {/* Columna Derecha con Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100 relative z-10">
          <div className="flex justify-center mb-8">
            <img src="/img/insumia_logo.png" alt="Insumia Logo" className="h-16 w-16 rounded-full object-cover border border-slate-200 drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-8 text-center tracking-tight">
            Iniciar Sesión
          </h1>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-all font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_12px_25px_rgb(37,99,235,0.35)] active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Ingresando...
                </>
              ) : 'Entrar a mi cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-blue-600/30 hover:decoration-blue-600">
              Crear cuenta
            </Link>
          </p>
        </div>
        
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-blue-50 blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-indigo-50 blur-3xl opacity-50 pointer-events-none"></div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { generarAlertasAutomaticas, calcularOEEPorLinea } from '@/services/dataService';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import PlanificacionLineas from '@/pages/PlanificacionLineas';
import Secuencia from '@/pages/Secuencia';
import Lineas from '@/pages/Lineas';
import Produccion from '@/pages/Produccion';
import Calidad from '@/pages/Calidad';
import Paradas from '@/pages/Paradas';
import MateriasPrimas from '@/pages/MateriasPrimas';
import Informes from '@/pages/Informes';
import Alertas from '@/pages/Alertas';
import Metricas from '@/pages/Metricas';
import PanelOperario from '@/pages/PanelOperario';
import PanelCalidad from '@/pages/PanelCalidad';
import Historial from '@/pages/Historial';
import Operarios from '@/pages/Operarios';
import Cualificaciones from '@/pages/Cualificaciones';
import Productos from '@/pages/Productos';
import Mantenimiento from '@/pages/Mantenimiento';
import Checklists from '@/pages/Checklists';
import Configuracion from '@/pages/Configuracion';
import Usuarios from '@/pages/Usuarios';
import Login from '@/pages/Login';
import { Loader2 } from 'lucide-react';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Sidebar />
      <Header />
      <main className="lg:pl-60 pt-16 transition-all duration-300">
        <div className="p-4 lg:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

// Componente para proteger cualquier ruta que requiera usuario logueado
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para proteger rutas sensibles por rol
function RequireRole({ roles, children }) {
  const { perfil, loading } = useAuth();
  
  if (loading) return null;
  
  // Si no hay perfil o su rol no está incluido en la lista permitida, redirigir
  if (!perfil || !roles.includes(perfil.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  useEffect(() => {
    generarAlertasAutomaticas();
    calcularOEEPorLinea();
    const handler = () => {
      generarAlertasAutomaticas();
      calcularOEEPorLinea();
    };
    window.addEventListener('materiales_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('planificacion_updated', handler);
    window.addEventListener('secuencia_reordenada', handler);
    window.addEventListener('secuencia_updated', handler);
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('produccion_updated', handler);
    window.addEventListener('calidad_updated', handler);
    return () => {
      window.removeEventListener('materiales_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('planificacion_updated', handler);
      window.removeEventListener('secuencia_reordenada', handler);
      window.removeEventListener('secuencia_updated', handler);
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('produccion_updated', handler);
      window.removeEventListener('calidad_updated', handler);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas de Planta (Accesibles para cualquier usuario autenticado) */}
          <Route path="/panel-operario" element={<RequireAuth><PanelOperario /></RequireAuth>} />
          <Route path="/panel-calidad" element={<RequireAuth><PanelCalidad /></RequireAuth>} />

          {/* Rutas de Back-Office */}
          <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/operarios" element={<RequireAuth><Layout><Operarios /></Layout></RequireAuth>} />
          <Route path="/planificacion" element={<RequireAuth><Layout><PlanificacionLineas /></Layout></RequireAuth>} />
          <Route path="/secuencia" element={<RequireAuth><Layout><Secuencia /></Layout></RequireAuth>} />
          <Route path="/lineas" element={<RequireAuth><Layout><Lineas /></Layout></RequireAuth>} />
          <Route path="/produccion" element={<RequireAuth><Layout><Produccion /></Layout></RequireAuth>} />
          <Route path="/calidad" element={<RequireAuth><Layout><Calidad /></Layout></RequireAuth>} />
          <Route path="/paradas" element={<RequireAuth><Layout><Paradas /></Layout></RequireAuth>} />
          <Route path="/checklists" element={<RequireAuth><Layout><Checklists /></Layout></RequireAuth>} />
          <Route path="/informes" element={<RequireAuth><Layout><Informes /></Layout></RequireAuth>} />
          <Route path="/alertas" element={<RequireAuth><Layout><Alertas /></Layout></RequireAuth>} />
          <Route path="/metricas" element={<RequireAuth><Layout><Metricas /></Layout></RequireAuth>} />
          <Route path="/historial" element={<RequireAuth><Layout><Historial /></Layout></RequireAuth>} />

          {/* Rutas Sensibles - RBAC */}
          <Route path="/configuracion" element={<RequireAuth><RequireRole roles={['admin', 'supervisor']}><Layout><Configuracion /></Layout></RequireRole></RequireAuth>} />
          <Route path="/cualificaciones" element={<RequireAuth><RequireRole roles={['admin', 'supervisor']}><Layout><Cualificaciones /></Layout></RequireRole></RequireAuth>} />
          <Route path="/productos" element={<RequireAuth><RequireRole roles={['admin', 'supervisor']}><Layout><Productos /></Layout></RequireRole></RequireAuth>} />
          <Route path="/materias-primas" element={<RequireAuth><RequireRole roles={['admin', 'supervisor']}><Layout><MateriasPrimas /></Layout></RequireRole></RequireAuth>} />
          <Route path="/usuarios" element={<RequireAuth><RequireRole roles={['admin']}><Layout><Usuarios /></Layout></RequireRole></RequireAuth>} />
          
          {/* Mantenimiento: Permitir a admin, supervisor y rol de mantenimiento */}
          <Route path="/mantenimiento" element={<RequireAuth><RequireRole roles={['admin', 'supervisor', 'mantenimiento']}><Layout><Mantenimiento /></Layout></RequireRole></RequireAuth>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

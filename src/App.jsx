import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { generarAlertasAutomaticas } from '@/services/dataService';
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
import Configuracion from '@/pages/Configuracion';

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

export default function App() {
  useEffect(() => {
    generarAlertasAutomaticas();
    const handler = () => generarAlertasAutomaticas();
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
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/panel-operario" element={<PanelOperario />} />
        <Route path="/panel-calidad" element={<PanelCalidad />} />
        <Route path="/operarios" element={<Layout><Operarios /></Layout>} />
        <Route path="/cualificaciones" element={<Layout><Cualificaciones /></Layout>} />
        <Route path="/productos" element={<Layout><Productos /></Layout>} />
        <Route path="/planificacion" element={<Layout><PlanificacionLineas /></Layout>} />
        <Route path="/secuencia" element={<Layout><Secuencia /></Layout>} />
        <Route path="/lineas" element={<Layout><Lineas /></Layout>} />
        <Route path="/produccion" element={<Layout><Produccion /></Layout>} />
        <Route path="/calidad" element={<Layout><Calidad /></Layout>} />
        <Route path="/paradas" element={<Layout><Paradas /></Layout>} />
        <Route path="/mantenimiento" element={<Layout><Mantenimiento /></Layout>} />
        <Route path="/materias-primas" element={<Layout><MateriasPrimas /></Layout>} />
        <Route path="/informes" element={<Layout><Informes /></Layout>} />
        <Route path="/alertas" element={<Layout><Alertas /></Layout>} />
        <Route path="/metricas" element={<Layout><Metricas /></Layout>} />
        <Route path="/historial" element={<Layout><Historial /></Layout>} />
        <Route path="/configuracion" element={<Layout><Configuracion /></Layout>} />
      </Routes>
    </Router>
  );
}

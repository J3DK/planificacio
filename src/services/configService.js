import { useState, useEffect } from 'react';

const LS_KEY_APP_CONFIG = 'mes_global_app_config';

export const DEFAULT_APP_CONFIG = {
  nombreEmpresa: 'MPS Producción',
  subtituloEmpresa: 'Smart MES Factory',
  razonSocial: 'MPS Manufacturing Services S.L.',
  cif: 'B-12345678',
  direccion: 'Polígono Industrial Las Azucenas, Nave 4, 28001 Madrid',
  telefono: '+34 910 123 456',
  emailContacto: 'operaciones@mpsproud.com',
  logoUrl: '', // Base64 de la imagen subida desde el PC
  pieReportes: 'Documento oficial generado por el Sistema MES de Producción & Calidad — Trazabilidad Industrial Certificada.',
  moneda: 'EUR',
  objetivoOEEPlanta: 85,
};

export function getAppConfig() {
  try {
    const raw = localStorage.getItem(LS_KEY_APP_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_APP_CONFIG, ...parsed };
    }
  } catch (_) {}
  return DEFAULT_APP_CONFIG;
}

export function updateAppConfig(newConfig) {
  try {
    const current = getAppConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(LS_KEY_APP_CONFIG, JSON.stringify(updated));
    // Disparar evento global para re-renderizado instantáneo en Sidebar, Header y Reportes
    window.dispatchEvent(new CustomEvent('app_config_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error al guardar configuración:', e);
    return null;
  }
}

// Custom Hook para que cualquier componente se actualice en tiempo real si cambia la configuración del logo/empresa
export function useAppConfig() {
  const [config, setConfig] = useState(getAppConfig());

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getAppConfig());
      }
    };

    window.addEventListener('app_config_updated', handleUpdate);
    return () => window.removeEventListener('app_config_updated', handleUpdate);
  }, []);

  return config;
}

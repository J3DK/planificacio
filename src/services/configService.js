import { useState, useEffect } from 'react';

const LS_KEY_APP_CONFIG = 'mes_global_app_config';

export const DEFAULT_MENU_ITEMS = [
  { path: '/',                   label: 'Resumen',              iconName: 'LayoutDashboard', exact: true, visible: true },
  { path: '/panel-operario',     label: 'Terminal Operario',    iconName: 'Cpu',             visible: true },
  { path: '/planificacion',      label: 'Planificación',        iconName: 'CalendarDays',    visible: true },
  { path: '/secuencia',          label: 'Secuencia',            iconName: 'ListOrdered',     visible: true },
  { path: '/lineas',             label: 'Líneas',               iconName: 'Factory',         visible: true },
  { path: '/operarios',          label: 'Operarios',            iconName: 'Users',           visible: true },
  { path: '/cualificaciones',    label: 'Cualificación & Cursos', iconName: 'Award',           visible: true },
  { path: '/lean',               label: 'Lean (Opex)',          iconName: 'Sparkles',        visible: true },
  { path: '/productos',          label: 'Productos',            iconName: 'Boxes',           visible: true },
  { path: '/produccion',         label: 'Producción',           iconName: 'BarChart2',       visible: true },
  { path: '/calidad',            label: 'Calidad',              iconName: 'CheckSquare',     visible: true },
  { path: '/paradas',            label: 'Paradas',              iconName: 'StopCircle',      visible: true },
  { path: '/mantenimiento',      label: 'Mantenimiento',        iconName: 'Wrench',          visible: true },
  { path: '/checklists',         label: 'Checklists & Pautas',  iconName: 'ListChecks',      visible: true },
  { path: '/materias-primas',    label: 'Materias Primas',      iconName: 'Package',         visible: true },
  { path: '/informes',           label: 'Informes',             iconName: 'FileBarChart',    visible: true },
  { path: '/alertas',            label: 'Alertas',              iconName: 'Bell',            visible: true },
  { path: '/metricas',           label: 'Métricas',             iconName: 'SlidersHorizontal', visible: true },
  { path: '/historial',          label: 'Historial',            iconName: 'History',         visible: true },
  { path: '/usuarios',           label: 'Gestión de Accesos',   iconName: 'Shield',          visible: true },
  { path: '/configuracion',      label: 'Configuración',        iconName: 'Settings',        visible: true },
];

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
  defaultViewMode: 'grid',
  objetivoOEEPlanta: 85,
  menuOrder: DEFAULT_MENU_ITEMS,
  rolesOperario: [
    'Operario Especialista', 'Jefe de Línea', 'Técnico de Mantenimiento',
    'Inspector de Calidad', 'Supervisor de Turno', 'Carretillero', 'Mecánico', 'Operador de Maquinaria Pesada'
  ],
  checklistCategorias: [
    { id: 'calidad', label: 'Calidad (QC)', color: 'blue' },
    { id: 'cil', label: 'CIL (Limpieza/Insp/Lub)', color: 'cyan' },
    { id: 'mantenimiento', label: 'Mantenimiento Preventivo', color: 'amber' },
    { id: '5s', label: '5S (Auditoría)', color: 'purple' }
  ],
  zonas5s: [
    { id: 'z1', nombre: 'Almacén Principal' },
    { id: 'z2', nombre: 'Línea 1 - Ensamblaje' },
    { id: 'z3', nombre: 'Zona de Expediciones' }
  ],
};

export function getAppConfig() {
  try {
    const raw = localStorage.getItem(LS_KEY_APP_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Asegurar que menuOrder contenga una lista válida o reconciliar si se agregaron nuevas rutas
      let currentMenu = Array.isArray(parsed.menuOrder) && parsed.menuOrder.length > 0
        ? parsed.menuOrder
        : DEFAULT_MENU_ITEMS;

      // Reconciliación para el módulo de Cualificación y Cursos
      if (!currentMenu.some(item => item.path === '/cualificaciones')) {
        const opIdx = currentMenu.findIndex(item => item.path === '/operarios');
        const cualifItem = { path: '/cualificaciones', label: 'Cualificación & Cursos', iconName: 'Award', visible: true };
        if (opIdx >= 0) {
          currentMenu.splice(opIdx + 1, 0, cualifItem);
        } else {
          currentMenu.push(cualifItem);
        }
      }

      // Reconciliación por si el usuario guardó el menú antes de la creación del módulo de Productos
      if (!currentMenu.some(item => item.path === '/productos')) {
        const opIdx = currentMenu.findIndex(item => item.path === '/operarios');
        const prodItem = { path: '/productos', label: 'Productos', iconName: 'Boxes', visible: true };
        if (opIdx >= 0) {
          currentMenu.splice(opIdx + 1, 0, prodItem);
        } else {
          currentMenu.push(prodItem);
        }
      }

      // Reconciliación para el módulo de Mantenimiento
      if (!currentMenu.some(item => item.path === '/mantenimiento')) {
        const parIdx = currentMenu.findIndex(item => item.path === '/paradas');
        const mtoItem = { path: '/mantenimiento', label: 'Mantenimiento', iconName: 'Wrench', visible: true };
        if (parIdx >= 0) {
          currentMenu.splice(parIdx + 1, 0, mtoItem);
        } else {
          currentMenu.push(mtoItem);
        }
      }

      // Reconciliación para el módulo de Checklists & Pautas
      if (!currentMenu.some(item => item.path === '/checklists')) {
        const mtoIdx = currentMenu.findIndex(item => item.path === '/mantenimiento');
        const chkItem = { path: '/checklists', label: 'Checklists & Pautas', iconName: 'ListChecks', visible: true };
        if (mtoIdx >= 0) {
          currentMenu.splice(mtoIdx + 1, 0, chkItem);
        } else {
          currentMenu.push(chkItem);
        }
      }

      // Reconciliación para el módulo de Usuarios (Gestión de Accesos)
      if (!currentMenu.some(item => item.path === '/usuarios')) {
        const confIdx = currentMenu.findIndex(item => item.path === '/configuracion');
        const usuItem = { path: '/usuarios', label: 'Gestión de Accesos', iconName: 'Shield', visible: true };
        if (confIdx >= 0) {
          currentMenu.splice(confIdx, 0, usuItem);
        } else {
          currentMenu.push(usuItem);
        }
      }

      // Reconciliación para categorías de checklists
      let currentChecklistCats = Array.isArray(parsed.checklistCategorias) && parsed.checklistCategorias.length > 0
        ? parsed.checklistCategorias
        : DEFAULT_APP_CONFIG.checklistCategorias;

      return { ...DEFAULT_APP_CONFIG, ...parsed, menuOrder: currentMenu, checklistCategorias: currentChecklistCats };
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

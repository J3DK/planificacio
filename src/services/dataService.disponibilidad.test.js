import { describe, it, expect, beforeEach } from 'vitest';
import {
  calcularDisponibilidadOrden,
  calcularTodosConsumosComprometidos,
  mapMaterial,
  mapProducto,
  reordenarSecuenciaEnGantt,
  getEquiposPlanos
} from '@/services/dataService';

// Polyfill minimalista de localStorage para entorno Node puro (sin JSDOM)
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

beforeEach(() => {
  global.localStorage = mockLocalStorage;
  mockLocalStorage.clear();
});

describe('2. Tests de calcularDisponibilidadOrden y calcularTodosConsumosComprometidos', () => {
  it('Producto con BOM completa y stock suficiente para todos sus componentes -> resultado disponible (verde)', () => {
    const listaProductos = [
      {
        codigo: 'PROD-VERDE',
        descripcion: 'Batería Completa OK',
        bom: [
          { codigo: 'MAT-101', descripcion: 'Celda LFP', factor: 2, unidad: 'ud' },
          { codigo: 'MAT-102', descripcion: 'Carcasa', factor: 1, unidad: 'ud' }
        ]
      }
    ];
    const listaMateriales = [
      { id: 1, codigo: 'MAT-101', stockActual: 500, criticidad: 'alta' },
      { id: 2, codigo: 'MAT-102', stockActual: 300, criticidad: 'media' }
    ];
    const orden = { ref: 'PROD-VERDE', cantidad: 100 };
    // Consumo previo/comprometido es 0
    const mapaConsumo = { 'MAT-101': 0, 'MAT-102': 0 };

    const res = calcularDisponibilidadOrden(orden, listaMateriales, listaProductos, mapaConsumo);

    expect(res.estado).toBe('verde');
    expect(res.esCritico).toBe(false);
    expect(res.sinBom).toBeFalsy();
    expect(res.componentes).toHaveLength(2);
    expect(res.componentes[0].estadoItem).toBe('OK');
    expect(res.componentes[1].estadoItem).toBe('OK');
  });

  it('Producto con stock suficiente en bruto pero ya comprometido por otras órdenes -> resultado insuficiente (NO verde)', () => {
    const listaProductos = [
      {
        codigo: 'PROD-COMPROMETIDO',
        bom: [
          { codigo: 'MAT-LIMITADO', factor: 1, unidad: 'ud' }
        ]
      }
    ];
    const listaMateriales = [
      // stockActual = 100. Parece suficiente para una orden nueva de 80 unidades...
      // ¡PERO ya hay 150 unidades comprometidas por otras órdenes pendientes!
      { id: 1, codigo: 'MAT-LIMITADO', stockActual: 100, criticidad: 'alta' }
    ];
    const orden = { ref: 'PROD-COMPROMETIDO', cantidad: 80 };
    const mapaConsumo = { 'MAT-LIMITADO': 150 };

    const res = calcularDisponibilidadOrden(orden, listaMateriales, listaProductos, mapaConsumo);

    // disponibleReal = stockActual (100) - comprometidoTotal (150) = -50 -> insuficiente
    expect(res.estado).not.toBe('verde');
    expect(res.estado).toBe('rojo'); // Al ser criticidad alta, marca rojo
    expect(res.esCritico).toBe(true);
    expect(res.componentes[0].stockDisponible).toBe(-50);
    expect(res.componentes[0].comprometidoTotal).toBe(150);
  });

  it('Producto sin BOM definida (bomPendiente: true o bom vacío) -> devuelve estado "sin datos" gris, no verde por defecto ni error', () => {
    const prodPendiente = { codigo: 'PROD-PENDIENTE', bomPendiente: true, bom: null };
    const prodVacio = { codigo: 'PROD-VACIO', bom: [] };
    const listaProductos = [prodPendiente, prodVacio];

    // Prueba con producto bomPendiente: true
    const resPend = calcularDisponibilidadOrden({ ref: 'PROD-PENDIENTE', cantidad: 50 }, [], listaProductos);
    expect(resPend.estado).toBe('gris');
    expect(resPend.sinBom).toBe(true);
    expect(resPend.esCritico).toBe(false);
    expect(resPend.componentes).toHaveLength(0);

    // Prueba con producto bom: [] explícitamente vacío
    const resVacio = calcularDisponibilidadOrden({ ref: 'PROD-VACIO', cantidad: 50 }, [], listaProductos);
    expect(resVacio.estado).toBe('gris');
    expect(resVacio.sinBom).toBe(true);
    expect(resVacio.componentes).toHaveLength(0);
  });

  it('Dos órdenes distintas del mismo producto compitiendo por el mismo componente -> la suma de comprometido refleja ambas', () => {
    const ordenes = [
      { id: 'O-101', ref: 'PROD-SHARED', cantidad: 100 },
      { id: 'O-102', ref: 'PROD-SHARED', cantidad: 250 }
    ];
    const productos = [
      {
        codigo: 'PROD-SHARED',
        bom: [
          { codigo: 'COMP-CRITICO', factor: 2, unidad: 'ud' }
        ]
      }
    ];

    const mapaConsumo = calcularTodosConsumosComprometidos({ ordenes, productos });

    // O-101 necesita 100 * 2 = 200 uds. O-102 necesita 250 * 2 = 500 uds. Total = 700 uds.
    expect(mapaConsumo['COMP-CRITICO']).toBe(700);
  });

  it('Componente con stockActual exactamente igual a la cantidad requerida -> disponible (verde, sin error > vs >=)', () => {
    const listaProductos = [
      {
        codigo: 'PROD-EXACTO',
        bom: [
          { codigo: 'MAT-EXACTO', factor: 1, unidad: 'ud' }
        ]
      }
    ];
    // Requerimos exactamente 100 uds. stockActual = 100, comprometidoTotal = 100.
    // disponibleReal = stockActual - comprometidoTotal = 100 - 100 = 0.
    const listaMateriales = [
      { id: 99, codigo: 'MAT-EXACTO', stockActual: 100, criticidad: 'alta' }
    ];
    const orden = { ref: 'PROD-EXACTO', cantidad: 100 };
    const mapaConsumo = { 'MAT-EXACTO': 100 };

    const res = calcularDisponibilidadOrden(orden, listaMateriales, listaProductos, mapaConsumo);

    expect(res.estado).toBe('verde');
    expect(res.componentes[0].stockDisponible).toBe(0);
    expect(res.componentes[0].estadoItem).toBe('OK');
  });
});

describe('3. Tests de mapMaterial y mapProducto', () => {
  it('mapMaterial normaliza alias de Supabase (snake_case) y tolera valores nulos o incompletos sin lanzar error', () => {
    expect(mapMaterial(null)).toBeNull();
    expect(mapMaterial(undefined)).toBeUndefined();

    const matDb = {
      id: 10,
      codigo: 'MAT-DB-1',
      descripcion: 'Material de base de datos',
      stock_actual: 450,
      stock_minimo: 50,
      stock_maximo: 1000,
      pedido_pendiente: 120,
      stock_reservado: 30,
      fecha_entrega: '2026-08-01'
    };

    const mapped = mapMaterial(matDb);
    expect(mapped.stockActual).toBe(450);
    expect(mapped.stockMinimo).toBe(50);
    expect(mapped.stockMaximo).toBe(1000);
    expect(mapped.pedidoPendiente).toBe(120);
    expect(mapped.stockReservado).toBe(30);
    expect(mapped.fechaEntrega).toBe('2026-08-01');

    // Objeto vacío sin campos opcionales ni numéricos -> fallback a 0 o undefined seguro
    const matVacio = mapMaterial({});
    expect(matVacio.stockActual).toBe(0);
    expect(matVacio.stockMinimo).toBe(0);
    expect(matVacio.stockReservado).toBe(0);
  });

  it('mapProducto normaliza BOM e imagen tolerando estructuras incompletas o nulas', () => {
    expect(mapProducto(null)).toBeNull();
    expect(mapProducto(undefined)).toBeUndefined();

    const prodConBom = {
      codigo: 'P-100',
      descripcion: 'Producto con BOM',
      bom: [
        { codigo: 'C-1', factor: 4 },
        { codigo: 'C-2', factor: 1 }
      ]
    };
    const mappedProd = mapProducto(prodConBom);
    expect(mappedProd.bom).toHaveLength(2);
    expect(mappedProd.bom[0].codigo).toBe('C-1');
    expect(mappedProd.bom[1].codigo).toBe('C-2');

    // Producto con bom nulo o no array no debe romper la función
    const prodSinBom = mapProducto({ codigo: 'P-SIN-BOM', bom: null });
    expect(prodSinBom.bom).toBeNull();
  });
});

describe('4. Tests de reordenarSecuenciaEnGantt', () => {
  it('Reordena órdenes por línea manteniendo la integridad (mismas órdenes, mismo total, sin duplicados ni pérdidas)', () => {
    const ganttInicial = [
      { id: 'G-1', linea: 'L-1', ref: 'PROD-1', duracion: 4, horaInicio: 6 },
      { id: 'G-2', linea: 'L-1', ref: 'PROD-2', duracion: 3, horaInicio: 10 },
      { id: 'G-3', linea: 'L-2', ref: 'PROD-3', duracion: 5, horaInicio: 6 }
    ];
    localStorage.setItem('mes_planificacion_gantt', JSON.stringify(ganttInicial));

    // Pedimos reordenar para que en L-1 vaya primero G-2 y después G-1
    const secuenciaOrdenada = [
      { ganttId: 'G-2' },
      { ganttId: 'G-1' },
      { ganttId: 'G-3' }
    ];

    const res = reordenarSecuenciaEnGantt(secuenciaOrdenada);
    expect(res.error).toBeNull();
    expect(res.data).toHaveLength(3);

    // Verificación de integridad: exactamente los mismos IDs sin duplicaciones ni pérdidas
    const ids = res.data.map(o => o.id).sort();
    expect(ids).toEqual(['G-1', 'G-2', 'G-3']);

    // Verificación de reordenamiento de horarios compactados desde horaInicio: 6
    const l1Orders = res.data.filter(o => o.linea === 'L-1').sort((a, b) => a.horaInicio - b.horaInicio);
    expect(l1Orders[0].id).toBe('G-2');
    expect(l1Orders[0].horaInicio).toBe(6);
    expect(l1Orders[1].id).toBe('G-1');
    expect(l1Orders[1].horaInicio).toBe(9); // 6 + duracion 3 de G-2

    const l2Orders = res.data.filter(o => o.linea === 'L-2');
    expect(l2Orders[0].id).toBe('G-3');
    expect(l2Orders[0].horaInicio).toBe(6);
  });

  it('Casos límite: lista vacía y lista de un solo elemento', () => {
    // Caso lista vacía
    localStorage.setItem('mes_planificacion_gantt', JSON.stringify([]));
    const resVacia = reordenarSecuenciaEnGantt([]);
    expect(resVacia.error).toBeNull();
    expect(resVacia.data).toEqual([]);

    // Caso lista de 1 solo elemento
    const unElemento = [{ id: 'G-SOLO', linea: 'L-UNO', duracion: 4, horaInicio: 14 }];
    localStorage.setItem('mes_planificacion_gantt', JSON.stringify(unElemento));
    const resSolo = reordenarSecuenciaEnGantt([{ ganttId: 'G-SOLO' }]);
    expect(resSolo.error).toBeNull();
    expect(resSolo.data).toHaveLength(1);
    expect(resSolo.data[0].id).toBe('G-SOLO');
    expect(resSolo.data[0].horaInicio).toBe(6); // Compactado al inicio del turno (6:00)
  });
});

describe('5. Test de getEquiposPlanos', () => {
  it('Aplana correctamente todos los nodos de jerarquía (máquinas y componentes) sin perder ninguno y sin duplicar', () => {
    const arbolJerarquia = [
      {
        id: 'PL-100',
        nombre: 'Planta Central',
        tipo: 'planta',
        hijos: [
          {
            id: 'LIN-100',
            nombre: 'Línea Ensamblaje 1',
            tipo: 'linea',
            hijos: [
              {
                id: 'MQ-201',
                nombre: 'Robot Soldador A',
                tipo: 'maquina',
                hijos: [
                  { id: 'COMP-301', nombre: 'Punta Soldadura', tipo: 'componente', hijos: [] },
                  { id: 'COMP-302', nombre: 'Servomotor Brazo', tipo: 'componente', hijos: [] }
                ]
              },
              {
                id: 'MQ-202',
                nombre: 'Cinta Transportadora',
                tipo: 'maquina',
                hijos: []
              }
            ]
          }
        ]
      }
    ];

    const planos = getEquiposPlanos(arbolJerarquia);

    // Debe contener exactamente 2 máquinas y 2 componentes = 4 elementos planos
    expect(planos).toHaveLength(4);

    const ids = planos.map(item => item.id);
    expect(ids).toContain('MQ-201');
    expect(ids).toContain('MQ-202');
    expect(ids).toContain('COMP-301');
    expect(ids).toContain('COMP-302');

    // No debe contener ni plantas ni líneas
    expect(ids).not.toContain('PL-100');
    expect(ids).not.toContain('LIN-100');

    // Verificación de no duplicidad
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);
  });
});

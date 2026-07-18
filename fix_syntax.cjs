const fs = require('fs');

// Fix PanelCalidad.jsx
let pCalidad = fs.readFileSync('src/pages/PanelCalidad.jsx', 'utf8');
pCalidad = pCalidad.replace("import {\nimport { useRealtimeSync } from '@/hooks/useRealtimeSync';", "import { useRealtimeSync } from '@/hooks/useRealtimeSync';\nimport {");
fs.writeFileSync('src/pages/PanelCalidad.jsx', pCalidad, 'utf8');

// Fix Productos.jsx
let pProductos = fs.readFileSync('src/pages/Productos.jsx', 'utf8');
pProductos = pProductos.replace("import {\nimport { useRealtimeSync } from '@/hooks/useRealtimeSync';", "import { useRealtimeSync } from '@/hooks/useRealtimeSync';\nimport {");
fs.writeFileSync('src/pages/Productos.jsx', pProductos, 'utf8');

// Fix Mantenimiento.jsx
let pMto = fs.readFileSync('src/pages/Mantenimiento.jsx', 'utf8');

// Undo the bad `{vistaActivos === 'arbol' && (` block at line 1049
pMto = pMto.replace(
  "{vistaActivos === 'arbol' && (\n              <div className=\"card p-5 border border-slate-800 bg-slate-950\">\n                <h3 className=\"section-title text-white font-black mb-4\">Evolucin \nde Disponibilidad por Lnea (%)</h3>",
  "<div className=\"card p-5 border border-slate-800 bg-slate-950\">\n                <h3 className=\"section-title text-white font-black mb-4\">Evolución \nde Disponibilidad por Línea (%)</h3>"
);

pMto = pMto.replace(
  "{vistaActivos === 'arbol' && (\n              <div className=\"card p-5 border border-slate-800 bg-slate-950\">\n                <h3 className=\"section-title text-white font-black mb-4\">Evolución \nde Disponibilidad por Línea (%)</h3>",
  "<div className=\"card p-5 border border-slate-800 bg-slate-950\">\n                <h3 className=\"section-title text-white font-black mb-4\">Evolución \nde Disponibilidad por Línea (%)</h3>"
);

// We need to properly wrap the tree at the right location
// The tree starts at `1197: <div className="card p-5 border border-slate-800 bg-slate-950">\n              {activos.map(nodo => (`
// Let's replace that.
pMto = pMto.replace(
  `<div className="card p-5 border border-slate-800 bg-slate-950">\n              {activos.map(nodo => (`,
  `{vistaActivos === 'arbol' && (\n            <div className="card p-5 border border-slate-800 bg-slate-950">\n              {activos.map(nodo => (`
);

// Also we need to check if there is an extra `)}` and `historialCode` injected in the wrong place.
// Wait, the `historialCode` was injected at `treeRenderEndReplacement`.
// The end was:
// `{activos.length === 0 && (\n                <div className="text-center py-12">\n                  <Factory className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />\n                  <p className="text-slate-400 font-bold">No hay activos registrados</p>\n                </div>\n              )}\n            </div>`
// Since `treeRenderEnd` is unique enough, it probably replaced it at the right spot (line 1215). But since we had a mismatched `{vistaActivos === 'arbol' && (` earlier, the `{` `}` matching failed.
// Actually, `treeRenderEnd` matched correctly at the end of the Activos tree!
// Let's just fix the opening `{vistaActivos === 'arbol' && (` so that it's at the correct `div`.

// Just to be sure, I will remove the wrongly placed `{vistaActivos === 'arbol' && (` wherever it is.
pMto = pMto.replace(
  /\{vistaActivos === 'arbol' && \(\s*<div className="card p-5 border border-slate-800 bg-slate-950">\s*<h3 className="section-title text-white font-black mb-4">Evolucin/g,
  '<div className="card p-5 border border-slate-800 bg-slate-950">\n                <h3 className="section-title text-white font-black mb-4">Evolución'
);

fs.writeFileSync('src/pages/Mantenimiento.jsx', pMto, 'utf8');

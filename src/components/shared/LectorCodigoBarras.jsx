import React, { useState, useEffect, useRef } from 'react';
import { Camera, Keyboard, X, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

export default function LectorCodigoBarras({ onScan, onClose }) {
  const [mode, setMode] = useState('usb'); // 'usb' | 'camera'
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // MODO USB (Escáner físico emulando teclado)
  useEffect(() => {
    if (mode === 'usb') {
      const input = inputRef.current;
      if (input) {
        input.focus();
      }
      
      const handleGlobalClick = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [mode]);

  const handleUsbKeyDown = (e) => {
    if (e.key === 'Enter') {
      const code = e.target.value.trim();
      if (code) {
        onScan(code);
        e.target.value = ''; // Limpiar para el siguiente escaneo
      }
    }
  };

  // MODO CÁMARA
  useEffect(() => {
    let scanner = null;
    
    if (mode === 'camera') {
      try {
        scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 150 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          },
          false
        );

        scanner.render((decodedText) => {
          onScan(decodedText);
          // Opcional: pausar el escáner si queremos que el usuario procese el diálogo, 
          // pero como queremos escaneos consecutivos, lo dejamos activo.
        }, (errorMessage) => {
          // Errores de escaneo en cada frame se pueden ignorar
        });
      } catch (err) {
        setError('Error al iniciar la cámara. Verifica los permisos.');
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.warn('Error clearing scanner', e));
      }
    };
  }, [mode, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            Escanear Código
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Toggle Mode */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('usb'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'usb' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Lector USB
            </button>
            <button
              onClick={() => { setMode('camera'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'camera' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              Cámara
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Área de Escaneo */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[300px] relative overflow-hidden">
            {mode === 'usb' ? (
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                  <Keyboard className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-white font-bold mb-2">Lector USB Activo</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Apunta y dispara con la pistola lectora. El código se capturará automáticamente.
                </p>
                {/* Input oculto para recibir las pulsaciones */}
                <input 
                  ref={inputRef}
                  type="text" 
                  autoFocus
                  onKeyDown={handleUsbKeyDown}
                  className="absolute opacity-0 pointer-events-none" 
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <style>{`
                  #reader { border: none !important; }
                  #reader__scan_region { background: transparent !important; }
                  #reader__dashboard_section_csr span { color: #cbd5e1 !important; font-family: inherit !important; }
                  #reader button { background: #4f46e5 !important; color: white !important; border: none !important; border-radius: 0.5rem !important; padding: 0.5rem 1rem !important; font-weight: bold !important; cursor: pointer; }
                  #reader select { background: #1e293b !important; color: white !important; border: 1px solid #334155 !important; border-radius: 0.5rem !important; padding: 0.5rem !important; margin-bottom: 0.5rem; }
                  #reader__dashboard_section_swaplink { color: #818cf8 !important; text-decoration: none !important; }
                `}</style>
                <div id="reader" className="w-full h-full"></div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

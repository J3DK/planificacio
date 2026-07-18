import React, { useState, useEffect, useRef } from 'react';
import { Camera, Keyboard, X, AlertCircle, Smartphone, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function LectorCodigoBarras({ onScan, onClose }) {
  const [mode, setMode] = useState('usb'); // 'usb' | 'camera' | 'movil_remoto'
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Estados para modo móvil remoto
  const [sessionId, setSessionId] = useState(null);
  const [remoteCodes, setRemoteCodes] = useState([]);
  const [channel, setChannel] = useState(null);

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

  // MODO MÓVIL REMOTO
  useEffect(() => {
    if (mode === 'movil_remoto') {
      if (!isSupabaseConfigured()) {
        setError('El escáner remoto requiere Supabase configurado y conexión a Internet.');
        return;
      }

      // Generar nuevo sessionId para evitar que sesiones antiguas envíen datos aquí
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setRemoteCodes([]); // Limpiar la lista al iniciar nueva sesión

      const ch = supabase.channel(`escaner-remoto:${newSessionId}`);
      
      ch.on('broadcast', { event: 'scan' }, (payload) => {
        const codigo = payload.payload.codigo;
        const fecha = payload.payload.fecha;
        onScan(codigo);
        setRemoteCodes(prev => [{ codigo, fecha }, ...prev].slice(0, 5)); // Guardar últimos 5 para UI
      }).subscribe();

      setChannel(ch);

      return () => {
        supabase.removeChannel(ch);
        setSessionId(null);
        setChannel(null);
      };
    } else {
      // Limpiar canal si cambiamos a otro modo
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      setSessionId(null);
    }
  }, [mode, onScan]);

  const getRemoteUrl = () => {
    if (!sessionId) return '';
    return `${window.location.origin}/escaner-movil/${sessionId}`;
  };

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
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
            <button
              onClick={() => { setMode('usb'); setError(null); }}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'usb' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Lector USB
            </button>
            <button
              onClick={() => { setMode('camera'); setError(null); }}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'camera' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              Cámara
            </button>
            
            {/* Opción de Móvil (Solo visible si Supabase está configurado o si queremos mostrarlo deshabilitado) */}
            {isSupabaseConfigured() && (
              <button
                onClick={() => { setMode('movil_remoto'); setError(null); }}
                className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'movil_remoto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Requiere conexión a Supabase"
              >
                <Smartphone className="w-4 h-4" />
                Móvil Remoto
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Área de Escaneo */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {mode === 'usb' && (
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
            )}
            
            {mode === 'camera' && (
              <div className="w-full h-full flex flex-col min-h-[300px]">
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

            {mode === 'movil_remoto' && !error && sessionId && (
              <div className="w-full h-full flex flex-col items-center justify-start p-6">
                <h3 className="text-white font-bold mb-2 text-center">Escanea este código con tu móvil</h3>
                <p className="text-xs text-slate-400 mb-6 text-center max-w-[250px]">
                  Utiliza la cámara de tu teléfono móvil para vincular el escáner a esta pantalla.
                </p>
                
                <div className="bg-white p-3 rounded-2xl mb-6 shadow-lg">
                  <QRCodeSVG value={getRemoteUrl()} size={160} />
                </div>
                
                <div className="w-full flex flex-col items-center">
                  {remoteCodes.length === 0 ? (
                    <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm font-bold">Esperando conexión del móvil...</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">Móvil conectado ✅</span>
                      </div>
                      <p className="text-xs font-black uppercase text-slate-500 text-center tracking-widest mb-2 border-b border-slate-800 pb-2">
                        {remoteCodes.length} códigos recibidos
                      </p>
                      <div className="flex flex-col gap-2 w-full max-h-[80px] overflow-y-auto pr-1 no-scrollbar">
                        {remoteCodes.map((rc, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex justify-between items-center animate-fade-in-up">
                            <span className="text-sm text-white font-mono">{rc.codigo}</span>
                            <span className="text-[10px] text-slate-500">{new Date(rc.fecha).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

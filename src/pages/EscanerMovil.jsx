import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';

export default function EscanerMovil() {
  const { sessionId } = useParams();
  const [error, setError] = useState(null);
  const [scannedCodes, setScannedCodes] = useState([]);
  const [channel, setChannel] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Esta función requiere conexión en tiempo real.');
      return;
    }

    if (!sessionId) {
      setError('ID de sesión no válido.');
      return;
    }

    // Inicializar el canal Broadcast
    const ch = supabase.channel(`escaner-remoto:${sessionId}`);
    
    // Nos suscribimos para poder enviar mensajes (la suscripción devuelve el canal)
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Suscrito al canal de escáner remoto:', sessionId);
      }
    });

    setChannel(ch);

    return () => {
      supabase.removeChannel(ch);
    };
  }, [sessionId]);

  useEffect(() => {
    if (error || !channel) return;

    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner(
        "reader-movil",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );

      scanner.render((decodedText) => {
        // Pausar inmediatamente para evitar escaneos múltiples
        scanner.pause(true);
        setIsPaused(true);

        // Al detectar un código
        const payload = {
          codigo: decodedText,
          fecha: new Date().toISOString()
        };

        // Enviar por broadcast
        channel.send({
          type: 'broadcast',
          event: 'scan',
          payload: payload
        }).then(() => {
          // Añadir a la lista local
          setScannedCodes(prev => [payload, ...prev].slice(0, 10)); // Mantener los últimos 10
        }).catch(err => {
          console.error("Error enviando broadcast:", err);
        });

      }, (errorMessage) => {
        // Ignorar errores frame a frame
      });
    } catch (err) {
      setError('Error al iniciar la cámara. Verifica los permisos.');
    }

    setScannerInstance(scanner);

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.warn('Error clearing scanner', e));
      }
    };
  }, [channel, error]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">Error de Conexión</h1>
        <p className="text-slate-400 max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col items-center justify-center text-center">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-indigo-400" />
          Escáner Remoto
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
          Vinculado a sesión de escritorio
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Área de cámara */}
        <div className="bg-black aspect-square max-h-[50vh] relative flex items-center justify-center overflow-hidden border-b border-slate-800 shadow-inner">
          <div id="reader-movil" className="w-full h-full"></div>
          <style>{`
            #reader-movil { border: none !important; width: 100% !important; height: 100% !important; }
            #reader-movil__scan_region { background: transparent !important; }
            #reader-movil__dashboard_section_csr span { color: #cbd5e1 !important; font-family: inherit !important; }
            #reader-movil button { background: #4f46e5 !important; color: white !important; border: none !important; border-radius: 0.5rem !important; padding: 0.5rem 1rem !important; font-weight: bold !important; cursor: pointer; margin-top: 10px; }
          `}</style>
        </div>

        {/* Lista de últimos escaneos */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Últimos Códigos ({scannedCodes.length})</span>
          </h2>
          
          {scannedCodes.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">Apunta la cámara a un código de barras</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scannedCodes.map((scan, idx) => (
                <div key={idx} className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{scan.codigo}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(scan.fecha).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded">
                    Enviado
                  </span>
                </div>
              ))}
            </div>
          )}

          {isPaused && (
            <div className="mt-4 animate-fade-in-up">
              <button
                onClick={() => {
                  if (scannerInstance) {
                    scannerInstance.resume();
                    setIsPaused(false);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-900/50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Escanear Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

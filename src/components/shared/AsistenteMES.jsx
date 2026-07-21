import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Mic, Loader2, Info } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function AsistenteMES() {
  const [isOpen, setIsOpen] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [historial, isLoading, isOpen]);

  // Si no hay Supabase configurado, no mostrar el asistente
  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newHistorial = [...historial, userMessage];
    setHistorial(newHistorial);
    setInput('');
    setIsLoading(true);

    try {
      // Usar Supabase functions para invocar asistente-mes
      const { data, error } = await supabase.functions.invoke('asistente-mes', {
        body: {
          pregunta: userMessage.content,
          historial: historial
        }
      });

      if (error) throw new Error(error.message || 'Error en la llamada a Edge Function');

      setHistorial([...newHistorial, { 
        role: 'assistant', 
        content: data.respuesta || 'No se obtuvo respuesta.',
        fuentes: data.fuentes || []
      }]);

    } catch (err) {
      console.error("Error llamando al Asistente MES:", err);
      setHistorial([...newHistorial, { 
        role: 'assistant', 
        content: `Error al contactar con el asistente: ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Tu navegador no soporta entrada de voz.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const isSpeechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 transition-transform active:scale-95 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        title="Consultar al Asistente MES"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Panel de Chat */}
      <div 
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Cabecera del Chat */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Asistente MES</h3>
              <p className="text-[10px] text-slate-400">Consultas operativas en tiempo real</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {historial.length === 0 && (
            <div className="text-center text-slate-500 text-xs mt-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>Hola. Puedes preguntarme sobre el estado de las líneas, alertas, stock o mantenimiento.</p>
            </div>
          )}

          {historial.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}
              >
                {msg.content}
              </div>
              
              {/* Fuentes del Asistente */}
              {msg.role === 'assistant' && msg.fuentes && msg.fuentes.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                  <Info className="w-3 h-3" />
                  <span>Basado en: {msg.fuentes.join(', ')}</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando datos...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleSpeechToText}
                className={`p-2.5 rounded-xl transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Dictar por voz"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre la planta..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

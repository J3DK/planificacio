import React, { useEffect, useState } from 'react';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchLineas } from '@/services/dataService';

export default function SupabaseStatus() {
  const [status, setStatus] = useState('checking'); // checking | online | demo

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      if (!isSupabaseConfigured()) {
        if (isMounted) setStatus('demo');
        return;
      }
      try {
        const result = await fetchLineas();
        if (isMounted) {
          setStatus(result.fromSupabase ? 'online' : 'demo');
        }
      } catch (e) {
        if (isMounted) setStatus('demo');
      }
    }
    checkStatus();
    return () => { isMounted = false; };
  }, []);

  return (
    <div
      title={
        status === 'online'
          ? 'Sincronización multi-dispositivo Realtime activa'
          : 'Sincronización inactiva. Modo local/fallback'
      }
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${
        status === 'online'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : status === 'demo'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-slate-800 border-slate-700 text-slate-400 animate-pulse'
      }`}
    >
      <Database className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">
        {status === 'online' && 'Supabase Online'}
        {status === 'demo' && 'Modo Demo (Mock)'}
        {status === 'checking' && 'Conectando DB...'}
      </span>
      {status === 'online' ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      ) : status === 'demo' ? (
        <WifiOff className="w-3 h-3 text-amber-400/80" />
      ) : null}
    </div>
  );
}

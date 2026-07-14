import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KPICard({ title, value, unit, sub, trend, trendValue, color = 'blue', size = 'md', className = '' }) {
  const colorMap = {
    blue:   { bg: 'from-blue-600/20 to-blue-500/5',   border: 'border-blue-500/30',  text: 'text-blue-400',   glow: '' },
    green:  { bg: 'from-emerald-600/20 to-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: '' },
    red:    { bg: 'from-red-600/20 to-red-500/5',     border: 'border-red-500/30',   text: 'text-red-400',    glow: '' },
    amber:  { bg: 'from-amber-600/20 to-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-400',  glow: '' },
    slate:  { bg: 'from-slate-700/30 to-slate-800/10', border: 'border-slate-700/50', text: 'text-slate-300',  glow: '' },
    purple: { bg: 'from-purple-600/20 to-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-400', glow: '' },
  };

  const c = colorMap[color] || colorMap.blue;
  const isPositive = trendValue > 0;
  const isNegative = trendValue < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = trend === 'good'
    ? (isPositive ? 'text-emerald-400' : 'text-red-400')
    : trend === 'bad'
    ? (isPositive ? 'text-red-400' : 'text-emerald-400')
    : 'text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} p-4 ${className}`}
    >
      {/* decorative orb */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 bg-current ${c.text} blur-xl`} />

      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 leading-none">{title}</p>

      <div className="flex items-end gap-1.5">
        <span className={`font-black leading-none ${c.text} ${size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl'}`}>
          {value}
        </span>
        {unit && <span className="text-slate-500 text-xs font-bold mb-1">{unit}</span>}
      </div>

      {(sub || trendValue !== undefined) && (
        <div className="flex items-center justify-between mt-2">
          {sub && <p className="text-[11px] text-slate-500 font-medium">{sub}</p>}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] font-bold ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{trendValue > 0 ? '+' : ''}{trendValue} pp</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

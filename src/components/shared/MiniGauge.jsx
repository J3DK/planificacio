import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function MiniGauge({ value, max = 100, color = '#3b82f6', label, size = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const data = [{ value: pct }];
  const getColor = (v) => {
    if (v >= 95) return '#10b981';
    if (v >= 85) return '#3b82f6';
    if (v >= 70) return '#f59e0b';
    return '#ef4444';
  };
  const gaugeColor = color === 'auto' ? getColor(pct) : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="60%" outerRadius="90%"
            startAngle={220} endAngle={-40}
            data={data}
            barSize={8}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            {/* track */}
            <RadialBar dataKey="value" cornerRadius={4} fill="#1e293b" background={{ fill: '#1e293b' }} angleAxisId={0} data={[{ value: 100 }]} />
            {/* value */}
            <RadialBar dataKey="value" cornerRadius={4} fill={gaugeColor} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-white">{pct}%</span>
        </div>
      </div>
      {label && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">{label}</p>}
    </div>
  );
}

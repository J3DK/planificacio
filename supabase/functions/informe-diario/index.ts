import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('Generando reporte diario...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener la fecha de hoy
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Obtener datos de Producción
    const { data: produccion, error: prodError } = await supabase
      .from('produccion')
      .select('objetivo, actual, linea')
      .gte('fecha', startOfDay.toISOString())
      .lte('fecha', endOfDay.toISOString());

    // 2. Obtener datos de Paradas
    const { data: paradas, error: paradasError } = await supabase
      .from('paradas_linea')
      .select('duracion, linea')
      .gte('hora_inicio', startOfDay.toISOString())
      .lte('hora_inicio', endOfDay.toISOString());

    // 3. Obtener Alertas (Bitácora)
    const { data: alertas, error: alertasError } = await supabase
      .from('alertas')
      .select('tipo, descripcion, modulo')
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString());

    if (prodError || paradasError || alertasError) {
      console.error('Error obteniendo datos de Supabase', { prodError, paradasError, alertasError });
    }

    // Calcular resúmenes
    let prodReal = 0;
    let prodObjetivo = 0;
    (produccion || []).forEach(p => {
      prodReal += Number(p.actual) || 0;
      prodObjetivo += Number(p.objetivo) || 0;
    });

    const rendimiento = prodObjetivo > 0 ? ((prodReal / prodObjetivo) * 100).toFixed(1) : 'N/A';
    
    let tiempoParadoMins = 0;
    (paradas || []).forEach(p => {
      tiempoParadoMins += Number(p.duracion) || 0;
    });

    const incidentesGaves = (alertas || []).filter(a => a.tipo === 'error' || a.tipo === 'critico').length;

    // 4. Formatear resumen en HTML
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px;">
        <h2 style="color: #3b82f6; border-bottom: 1px solid #334155; padding-bottom: 10px;">Resumen de Planta - Turno Diario</h2>
        <p style="font-size: 14px; color: #cbd5e1;">Fecha: ${startOfDay.toLocaleDateString()}</p>
        
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #10b981;">KPIs de Producción</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>Producción Real:</strong> ${prodReal} unidades</li>
            <li style="margin-bottom: 8px;"><strong>Producción Objetivo:</strong> ${prodObjetivo} unidades</li>
            <li style="margin-bottom: 8px;"><strong>Rendimiento Global:</strong> ${rendimiento}%</li>
            <li style="margin-bottom: 8px;"><strong>Tiempo de Paradas:</strong> ${tiempoParadoMins} minutos</li>
          </ul>
        </div>

        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #ef4444;">Alertas y Bitácora</h3>
          <p><strong>Incidentes Críticos/Errores reportados hoy:</strong> ${incidentesGaves}</p>
          <p style="font-size: 12px; color: #64748b;">Revisar el panel web para más detalles.</p>
        </div>
      </div>
    `;

    // 5. Enviar email usando Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'MES NextGen <onboarding@resend.dev>',
          to: ['planta@empresa.com'], // Idealmente un email configurado
          subject: `Reporte Diario de Producción - ${startOfDay.toLocaleDateString()}`,
          html: htmlBody
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error enviando email con Resend', errorText);
        return new Response(JSON.stringify({ error: 'Fallo al enviar el email' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
      }
    } else {
      console.warn("RESEND_API_KEY no configurada. Saltando envío de email.");
    }

    return new Response(JSON.stringify({ success: true, message: 'Reporte generado con éxito', data: { prodReal, rendimiento, incidentesGaves } }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})

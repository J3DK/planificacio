import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pregunta, historial = [] } = await req.json();

    if (!pregunta) {
      return new Response(JSON.stringify({ error: 'Falta la pregunta' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiKey) {
      throw new Error("Falta GEMINI_API_KEY. Configura el secreto en Supabase: supabase secrets set GEMINI_API_KEY=tu_clave");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const tools = [{
      functionDeclarations: [
        {
          name: "consultar_estado_lineas",
          description: "Consulta el estado actual de todas las líneas de producción, producción de hoy, objetivos y estado de la máquina."
        },
        {
          name: "consultar_alertas_criticas",
          description: "Consulta las alertas críticas actuales no resueltas o no leídas en la planta."
        },
        {
          name: "consultar_ots_abiertas",
          description: "Consulta las órdenes de trabajo (mantenimiento) que están actualmente abiertas o en curso."
        },
        {
          name: "consultar_historial_activo",
          description: "Consulta el historial de mantenimiento y órdenes de trabajo para un activo específico.",
          parameters: { 
            type: "OBJECT", 
            properties: {
              activo_id: { type: "STRING", description: "El ID o nombre del activo/máquina a buscar" }
            },
            required: ["activo_id"]
          }
        },
        {
          name: "consultar_disponibilidad_material",
          description: "Consulta el stock, disponibilidad y ubicación de materias primas o componentes."
        },
        {
          name: "consultar_kaizen_mes",
          description: "Consulta los proyectos de mejora continua (Kaizen) implementados o en curso en el mes actual."
        },
        {
          name: "consultar_plan_linea",
          description: "Consulta la planificación o secuencia de producción para una línea específica.",
          parameters: { 
            type: "OBJECT", 
            properties: {
              linea: { type: "STRING", description: "El nombre o identificador de la línea (ej. 'Línea 1')" }
            },
            required: ["linea"]
          }
        }
      ]
    }];

    const systemInstruction = {
      parts: [{
        text: `Eres el asistente virtual del Sistema de Ejecución de Manufactura (MES).
Tu misión es ayudar a operarios, supervisores e ingenieros a consultar el estado de la planta.
Responde únicamente con datos obtenidos a través de las herramientas disponibles. Si la pregunta no se puede responder con estas herramientas, dilo claramente en vez de inventar una respuesta.
No expongas nunca datos de coste/salario si no están relacionados con la pregunta.
Tu tono debe ser profesional, conciso y directo (industrial). No divagues.
Solo tienes permisos de lectura. Si el usuario te pide modificar, cerrar o crear algo, indícale que por el momento solo puedes realizar consultas.`
      }]
    };

    let contents = [];
    // Convertir historial simple a formato Gemini
    for (const msg of historial) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        contents.push({ 
          role: msg.role === 'user' ? 'user' : 'model', 
          parts: [{ text: msg.content }] 
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: pregunta }] });

    let herramientasUsadas = new Set();
    let isComplete = false;
    let finalResponse = "";
    let iteraciones = 0;
    const MAX_ITERACIONES = 5;

    while (!isComplete && iteraciones < MAX_ITERACIONES) {
      iteraciones++;
      
      const geminiReq = {
        systemInstruction,
        contents,
        tools,
      };

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiReq)
      });

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        console.error("Error from Gemini:", err);
        throw new Error("Error en el modelo de lenguaje de Gemini");
      }

      const responseData = await geminiRes.json();
      const candidate = responseData.candidates?.[0];
      
      if (!candidate) {
        throw new Error("Gemini no devolvió candidatos.");
      }

      // Guardar la respuesta del modelo en los contenidos
      const responseParts = candidate.content.parts;
      contents.push({
        role: "model",
        parts: responseParts
      });

      // Comprobar si el modelo hizo un functionCall
      const functionCalls = responseParts.filter(p => p.functionCall);

      if (functionCalls.length > 0) {
        // Ejecutar funciones
        let functionResponsesParts = [];

        for (const callPart of functionCalls) {
          const fnName = callPart.functionCall.name;
          const fnArgs = callPart.functionCall.args || {};
          herramientasUsadas.add(fnName);
          let resultData = null;

          try {
            switch (fnName) {
              case "consultar_estado_lineas": {
                const { data } = await supabase.from('lineas').select('*');
                resultData = data?.map(l => ({
                  nombre: l.nombre,
                  estado: l.estado,
                  oee: l.oee || (l.objetivo_hoy ? ((l.produccion_hoy || 0)/l.objetivo_hoy*100).toFixed(1) : 'N/A'),
                  produccion_hoy: l.produccion_hoy,
                  objetivo_hoy: l.objetivo_hoy,
                  motivo_parada: l.motivo_parada
                }));
                break;
              }
              case "consultar_alertas_criticas": {
                const { data } = await supabase.from('alertas')
                  .select('*')
                  .in('tipo', ['critica', 'error'])
                  .eq('resuelta', false);
                resultData = data;
                break;
              }
              case "consultar_ots_abiertas": {
                const { data } = await supabase.from('ordenes_trabajo')
                  .select('codigo, titulo, estado, prioridad, linea, activo')
                  .in('estado', ['abierta', 'en curso']);
                resultData = data;
                break;
              }
              case "consultar_historial_activo": {
                const activo_id = fnArgs.activo_id;
                const { data } = await supabase.from('ordenes_trabajo')
                  .select('codigo, titulo, estado, fecha_cierre, tipo, linea, activo')
                  .ilike('activo', `%${activo_id}%`);
                resultData = data;
                break;
              }
              case "consultar_disponibilidad_material": {
                const { data } = await supabase.from('materias_primas').select('codigo, descripcion, stock_actual, stock_reservado, unidad');
                resultData = data?.map(m => ({
                  ...m,
                  disponible_real: (m.stock_actual || 0) - (m.stock_reservado || 0)
                }));
                break;
              }
              case "consultar_kaizen_mes": {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0,0,0,0);
                const { data } = await supabase.from('kaizen')
                  .select('*')
                  .gte('fecha_implementacion', startOfMonth.toISOString());
                resultData = data;
                break;
              }
              case "consultar_plan_linea": {
                const linea = fnArgs.linea;
                const { data } = await supabase.from('secuencia')
                  .select('secuencia, referencia, estado, cantidad, cliente, linea_nombre')
                  .ilike('linea_nombre', `%${linea}%`)
                  .order('secuencia', { ascending: true });
                resultData = data;
                break;
              }
              default:
                resultData = { error: "Herramienta no implementada" };
            }
          } catch (e) {
            resultData = { error: e.message };
          }

          functionResponsesParts.push({
            functionResponse: {
              name: fnName,
              response: { result: resultData || { msg: "No se encontraron datos" } }
            }
          });
        }

        // Enviar resultados de vuelta al modelo
        contents.push({
          role: "user",
          parts: functionResponsesParts
        });

      } else {
        // Respuesta final de texto
        isComplete = true;
        const textBlock = responseParts.find(p => p.text);
        finalResponse = textBlock ? textBlock.text : "";
      }
    }

    if (iteraciones >= MAX_ITERACIONES && !isComplete) {
      finalResponse = "Lo siento, tuve que detenerme porque la consulta requirió demasiados pasos. Por favor, reformula tu pregunta de manera más específica.";
    }

    return new Response(
      JSON.stringify({ 
        respuesta: finalResponse, 
        fuentes: Array.from(herramientasUsadas) 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en Asistente MES (Gemini):', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

# Campuslands CRM

CRM web para administrar prospectos de admisiones, embudo Kanban, seguimiento por WhatsApp, tratos, pagos e indicadores. Está construido con Next.js, TypeScript y Supabase/PostgreSQL, y puede desplegarse en Vercel.

## Lo que incluye

- Resumen con leads, conversión, ingresos cobrados, valor del embudo y seguimientos vencidos.
- Tablero Kanban con seis etapas y movimiento de tarjetas mediante arrastrar y soltar.
- Fichas de contacto con origen, programa, interés, precio del trato, método esperado, próxima tarea y notas.
- Registro de pagos parciales, pendientes o recibidos, con método, vencimiento y referencia.
- Reportes con pastel por origen, barras de leads e inscritos por origen, conversión, embudo y tendencia mensual.
- Botón de WhatsApp que abre el chat con un texto preparado. El usuario confirma y envía el mensaje en WhatsApp.
- Sincronización periódica de la hoja de Google Sheets. El Apps Script compara cambios y reenvía solo filas nuevas o editadas.
- Exportación de contactos a CSV.
- Autenticación Supabase. La vista sin credenciales es un modo de demostración local y no sincroniza usuarios ni dispositivos.

## Requisitos

- Node.js 20.9 o posterior.
- Un proyecto Supabase.
- Una cuenta Vercel para publicar el frontend y el endpoint de integración.
- Permiso de edición en el Google Sheet para instalar el Apps Script.

## Desarrollo local

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000`. Sin variables de Supabase se inicia en modo demostración; los cambios se guardan solo en el navegador actual. Para trabajar con datos reales, crea `.env.local` con:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_PUBLISHABLE_O_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
SHEETS_SYNC_SECRET=UN_SECRETO_LARGO_ALEATORIO
```

`SUPABASE_SERVICE_ROLE_KEY` y `SHEETS_SYNC_SECRET` son secretos de servidor. No se agrega el prefijo `NEXT_PUBLIC_`, no los incluyas en el código del navegador y no los subas al repositorio.

## Configurar Supabase

1. Crea un proyecto y ejecuta en **SQL Editor**, en orden, `supabase/migrations/202610050001_initial_crm.sql` y `supabase/migrations/202610070001_sheet_sync_audit.sql`.
2. En **Authentication → Users**, crea las cuentas de las personas que usarán el CRM. El acceso público no tiene formulario de registro.
3. Copia la URL, la clave publicable (o `anon` en proyectos anteriores) y la clave `service_role` del proyecto a `.env.local`.
4. Para actualizaciones en tiempo real entre usuarios, habilita `leads` y `payments` en la publicación `supabase_realtime` desde Database → Publications.
5. No uses la clave `service_role` en Vercel como variable `NEXT_PUBLIC_*`. Esta clave evita RLS y solo la utiliza el endpoint servidor de Sheets.

La migración configura Row Level Security y da a todos los usuarios autenticados acceso a los datos del mismo equipo. Es un espacio de trabajo compartido; todavía no hay aislamiento de datos por usuario ni roles diferenciados.

## Desplegar en Vercel

1. Sube este repositorio a GitHub y crea un proyecto en Vercel conectado al repositorio.
2. En **Settings → Environment Variables**, configura las cuatro variables del ejemplo para Production, Preview y Development según corresponda.
3. Despliega. La aplicación y `/api/integrations/sheets` se publican en el mismo dominio.
4. Crea el primer usuario del equipo desde Supabase Auth e inicia sesión en la URL de Vercel.

GitHub Pages no puede ejecutar el endpoint seguro de sincronización ni proteger la clave de servicio; por eso esta app requiere un host con funciones de servidor como Vercel.

## Conectar Google Sheets

El Apps Script está en `integrations/google-sheets/Code.gs`. Está configurado para leer **Marketing IA** y **De 0 a Agentes**. Usa el nombre normalizado de los encabezados, no su posición; si la hoja cambia los títulos, ajusta los alias explícitos de `CRM_CONFIG.columnMap`. El script crea pestañas ocultas `__CRM_SYNC_STATE` (checkpoints) y `__CRM_SYNC_ERRORS` (errores y conflictos). No las borres mientras el activador esté activo.

1. Despliega la aplicación en Vercel y copia su dominio.
2. Abre el Google Sheet → **Extensiones → Apps Script**. Copia allí el contenido de `Code.gs`.
3. En `CRM_CONFIG.endpoint`, reemplaza `https://YOUR-VERCEL-DOMAIN.vercel.app` por el dominio real.
4. En Apps Script abre **Project Settings → Script properties** y crea `CRM_SYNC_SECRET` con el mismo valor de `SHEETS_SYNC_SECRET` configurado en Vercel.
5. Ejecuta `syncLeadsToCrm` una vez y concede los permisos solicitados.
6. Ejecuta `createFiveMinuteTrigger` una vez para activar la sincronización cada cinco minutos.

El primer recorrido envía todos los registros no vacíos de ambas pestañas, en lotes. Conserva la fecha de entrada de la hoja para que los reportes históricos queden en el periodo correcto. La clave de cruce actual es teléfono normalizado + producto (`source_key`). Los recorridos posteriores envían filas nuevas o editadas. Si el lead ya existe, **CRM es la fuente de verdad**: no se sobrescriben sus campos editados desde la app; el cambio de Sheets se registra como conflicto en `sync_logs` y `__CRM_SYNC_ERRORS` para revisión. Así se evita una política de “última escritura” incorrecta, ya que Sheets no aporta un `updated_at` fiable por fila.

La sincronización usa lotes, bloqueo para evitar ejecuciones simultáneas, reintentos con espera incremental y un límite de tiempo inferior al máximo de Apps Script. Solo marca como procesada una fila cuando el servidor devuelve resultado; los errores quedan pendientes para el siguiente recorrido. El endpoint evita duplicados con `source_key`. Si el bot envía teléfonos como números, los normaliza para el enlace de WhatsApp.

La conexión es inicialmente **Sheets → CRM**. Administra las etapas y el seguimiento en la app. Si se modifica una fila en Sheets, se vuelve a enviar su estado y notas; evita editar el mismo campo en ambos sitios. Apps Script corre en la cuenta de quien instaló el activador y seguirá sincronizando mientras esa cuenta conserve acceso al documento.

## Definición de métricas

- **Leads del periodo:** registros con fecha de entrada dentro del rango elegido.
- **Conversión por origen:** leads de ese origen captados en el periodo que hoy están en etapa `Inscrito` ÷ total de leads de ese origen captados en el mismo periodo. Es una conversión por cohorte de entrada; las cohortes recientes aún pueden seguir madurando.
- **Ingresos cobrados:** suma de registros de pago en estado `Pagado`, agrupados por fecha de pago. El monto del trato es el valor acordado, no equivale a dinero recibido.
- **Valor en seguimiento:** suma de precios de tratos en etapas activas, excluyendo inscritos y no interesados.

Los pagos se registran manualmente en este MVP. No se conecta a bancos ni pasarelas, y el botón de WhatsApp abre un chat con texto sugerido, pero no envía mensajes en segundo plano.

## Estructura

```text
app/                         Interfaz y endpoint de integración
features/dashboard/           Resumen y reportes
features/leads/               Contactos, fichas y tablero Kanban
features/payments/            Pagos e ingresos
components/ui/                Componentes visuales compartidos
hooks/                        Estado y operaciones compartidas del CRM
integrations/google-sheets/  Apps Script de sincronización
lib/                         Tipos y datos de demostración
supabase/migrations/          Esquema SQL, índices y políticas RLS
```

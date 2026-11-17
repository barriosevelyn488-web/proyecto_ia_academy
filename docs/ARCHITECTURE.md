# Arquitectura de Campuslands CRM (ADR)

## Decisión Arquitectónica

Este proyecto sigue una arquitectura de **Monolito Modular en Capas (Next.js App Router + Supabase/PostgreSQL)** con **Puertos y Adaptadores (Hexagonal ligero)** para canales externos e integraciones.

```text
  [ Canales Externos ]               [ Interfaz Web (Next.js) ]
  - Bot de Iza / WhatsApp            - features/* (UI bajo demanda con next/dynamic)
  - Google Sheets (Code.gs)          - hooks/use-crm.ts (Estado + Modo Ligero)
            │                                     │
            ▼                                     ▼
  [ Adaptadores Hexagonales ]        [ Capa de Repositorio ]
  - lib/adapters/bot-webhook         - lib/services/crm-repository.ts
  - lib/adapters/google-sheets       - (SupabaseCrmRepository / LocalDemo)
            │                                     │
            └──────────────► [ Dominio ] ◄────────┘
                     lib/domain/phone.ts (E.164 + source_key)
                     lib/domain/stage-mapper.ts
                     lib/domain/lead-ingress.ts
                                 │
                                 ▼
                    [ Supabase / PostgreSQL ]
                    - RLS + Multi-organización (organizations)
                    - Auditoría (lead_events, lead_activities, sync_logs)
                    - RPC agregada get_crm_summary()
```

## Por qué esta decisión es inteligente y vendible

1. **No usa microservicios innecesarios:** un solo despliegue en Vercel mantiene latencia mínima, cero costos de orquestación y mantenimiento simple para el equipo.
2. **El Bot sí vive desacoplado:** el Bot de Iza (o cualquier flujo de n8n/WhatsApp Cloud API) se comunica por HTTP con `/api/integrations/bot` usando Bearer Token. Si el bot cambia de tecnología o cae, el CRM sigue operando al 100 %.
3. **Núcleo de dominio sin duplicación:** la normalización de teléfonos (`+502`), claves idempotentes (`source_key`) y mapeo de etapas viven en `lib/domain/` y alimentan tanto a la UI como a Sheets y al Bot.
4. **Política anti-sobreescritura:** si un vendedor ya movió un lead o escribió notas en el CRM, un reenvío desde Google Sheets o del Bot no destruye el trabajo del asesor; registra auditoría en `sync_logs` o `lead_activities`.
5. **Listo para crecer y venderse como SaaS:** la migración `202611170001_saas_architecture_and_rbac.sql` incorpora `organizations`, `organization_members` (roles `admin`, `coordinator`, `advisor`), `assigned_to`, `loss_reason`, `nit` y la función SQL `get_crm_summary()` para calcular KPIs en servidor cuando existan decenas de miles de registros.
6. **Bajo consumo de RAM y ancho de banda:** carga diferida de módulos pesados (`recharts`, Kanban, modales), paginación de tablas, selección explícita de columnas, *debounce* de Realtime y **Modo Ligero** activable por el usuario.

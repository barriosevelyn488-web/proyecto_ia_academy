import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Lead, STAGES, money } from "@/lib/types";
import { formatDate, isLate } from "@/lib/formatters";
import { LeadAvatar, StageBadge } from "@/components/ui/crm-primitives";

export function LeadTable({
  leads,
  onOpen,
  onWhatsApp,
  showAll = false,
  pageSize = 25,
}: {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  showAll?: boolean;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [leads.length, pageSize]);

  if (!leads.length)
    return <div className="empty-state">No hay contactos para mostrar.</div>;

  const limit = showAll ? pageSize : 8;
  const totalPages = Math.max(1, Math.ceil(leads.length / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const visibleLeads = showAll ? leads.slice(start, start + limit) : leads.slice(0, limit);

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contacto</th>
              <th>Origen</th>
              <th>Etapa</th>
              <th>Interés</th>
              <th>Próximo contacto</th>
              <th>Trato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleLeads.map((lead) => (
            <tr key={lead.id} onClick={() => onOpen(lead)}>
              <td>
                <div className="person-cell">
                  <LeadAvatar name={lead.full_name} />
                  <div>
                    <div className="person-name">{lead.full_name || "Sin nombre"}</div>
                    <div className="person-sub">{lead.phone}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="origin-chip">{lead.origin || "Sin origen"}</span>
              </td>
              <td>
                <StageBadge stage={lead.stage} />
              </td>
              <td>
                {lead.interest === "alto"
                  ? "Alto"
                  : lead.interest === "medio"
                    ? "Medio"
                    : lead.interest === "bajo"
                      ? "Bajo"
                      : "—"}
              </td>
              <td>
                <span className={`due ${isLate(lead.next_contact_at) ? "late" : ""}`}>
                  {lead.next_contact_at ? formatDate(lead.next_contact_at) : "—"}
                </span>
              </td>
              <td>
                <span className="deal-total">{money(lead.deal_amount)}</span>
              </td>
              <td>
                <button
                  className="whatsapp-link"
                  title="Abrir WhatsApp"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsApp(lead);
                  }}
                >
                  <MessageCircle size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {showAll && totalPages > 1 && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        <span>
          Mostrando {start + 1}–{Math.min(start + limit, leads.length)} de {leads.length}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            type="button"
            className="button small"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} /> Anterior
          </button>
          <span>
            Página {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="button small"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente <ChevronRight size={13} />
          </button>
        </div>
      </div>
    )}
    </>
  );
}

export function FilterRow({
  origins,
  origin,
  stage,
  onOrigin,
  onStage,
}: {
  origins: string[];
  origin: string;
  stage: string;
  onOrigin: (value: string) => void;
  onStage: (value: string) => void;
}) {
  return (
    <div className="filter-row">
      <label>
        Origen
        <select
          className="select"
          value={origin}
          onChange={(e) => onOrigin(e.target.value)}
        >
          <option value="todos">Todos los orígenes</option>
          {origins.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Etapa
        <select
          className="select"
          value={stage}
          onChange={(e) => onStage(e.target.value)}
        >
          <option value="todos">Todas las etapas</option>
          {STAGES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

import { ArrowRight, MessageCircle } from "lucide-react";
import { Lead, Stage, STAGES, money } from "@/lib/types";
import { formatDate, isLate } from "@/lib/formatters";
import { LeadAvatar, StageBadge } from "@/components/ui/crm-primitives";

export function LeadTable({
  leads,
  onOpen,
  onWhatsApp,
  showAll = false,
}: {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  showAll?: boolean;
}) {
  if (!leads.length)
    return <div className="empty-state">No hay contactos para mostrar.</div>;
  return (
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
          {leads.map((lead) => (
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

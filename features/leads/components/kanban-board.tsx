"use client";

import { CalendarClock, GripVertical, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { Lead, Stage, STAGES, money } from "@/lib/types";
import { PriorityBadge } from "@/components/ui/crm-primitives";

type KanbanBoardProps = {
  leads: Lead[];
  onMove: (lead: Lead, stage: Stage) => void;
  onOpen: (lead: Lead) => void;
  focusedStage?: Stage | "todos";
  stages?: { id: string; label: string; color: string; bg?: string }[];
};

export function KanbanBoard({
  leads,
  onMove,
  onOpen,
  focusedStage = "todos",
  stages = STAGES,
}: KanbanBoardProps) {
  const visibleStages =
    focusedStage === "todos" ? stages : stages.filter((s) => s.id === focusedStage);

  return (
    <>
      <div className="toolbar">
        <div className="kanban-hint">
          <GripVertical size={14} /> Arrastra las tarjetas entre columnas para avanzar de etapa.
        </div>
        <span className="count-label">{leads.length} prospectos en el flujo</span>
      </div>
      <div className="kanban-scroll">
        <div className="kanban" style={{ gridTemplateColumns: `repeat(${visibleStages.length}, minmax(290px, 1fr))` }}>
          {visibleStages.map((stage) => {
            const cards = leads.filter((lead) => lead.stage === stage.id);
            return (
              <div
                className="kanban-column"
                key={stage.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const leadId = event.dataTransfer.getData("text/plain");
                  const lead = leads.find((item) => item.id === leadId);
                  if (lead) onMove(lead, stage.id as Stage);
                }}
              >
                <div className="column-head">
                  <span className="column-name">
                    <i className="column-indicator" style={{ background: stage.color }} />
                    {stage.label}
                  </span>
                  <span className="column-count">{cards.length}</span>
                </div>
                {cards.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", lead.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    className="kanban-card"
                    onClick={() => onOpen(lead)}
                  >
                    <div className="card-title-row">
                      <div>
                        <div className="card-name">{lead.full_name || "Sin nombre"}</div>
                        <div className="card-product" style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {lead.phone} · <strong style={{ color: "#2563eb" }}>{lead.product || "CODE UP"}</strong>
                        </div>
                      </div>
                      <button
                        className="card-menu"
                        title="Abrir ficha"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpen(lead);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="card-tags" style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0" }}>
                      <span className="origin-chip">{lead.origin || "BOT"}</span>
                      {lead.priority && <PriorityBadge priority={lead.priority} />}
                      {lead.agreement && (
                        <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: 4, background: "#f3f4f6", color: "#374151", fontWeight: 600 }}>
                          {lead.agreement}
                        </span>
                      )}
                    </div>

                    <div className="card-foot">
                      <span>
                        {lead.next_contact_at ? (
                          <>
                            <CalendarClock
                              size={11}
                              style={{ verticalAlign: "-2px", marginRight: 4 }}
                            />
                            {formatDate(lead.next_contact_at)}
                          </>
                        ) : (
                          lead.created_at ? lead.created_at.slice(0, 10) : "Sin fecha"
                        )}
                      </span>
                      <span className="card-value">{money(lead.deal_amount)}</span>
                    </div>
                  </article>
                ))}
                {cards.length === 0 && (
                  <div className="kanban-empty">No hay prospectos en esta etapa</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

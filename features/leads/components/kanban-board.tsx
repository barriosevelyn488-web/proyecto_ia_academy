"use client";

import { CalendarClock, GripVertical, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { Lead, Stage, STAGES, money } from "@/lib/types";

type KanbanBoardProps = {
  leads: Lead[];
  onMove: (lead: Lead, stage: Stage) => void;
  onOpen: (lead: Lead) => void;
};

export function KanbanBoard({ leads, onMove, onOpen }: KanbanBoardProps) {
  return (
    <>
      <div className="toolbar">
        <div className="kanban-hint">
          <GripVertical size={14} /> Arrastra las tarjetas para cambiar la etapa del lead.
        </div>
        <span className="count-label">{leads.length} prospectos</span>
      </div>
      <div className="kanban-scroll">
        <div className="kanban">
          {STAGES.map((stage) => {
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
                  if (lead) onMove(lead, stage.id);
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
                        <div className="card-product">
                          {lead.product || "Sin producto"}
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
                    <div className="card-tags">
                      <span className="origin-chip">{lead.origin || "Sin origen"}</span>
                      {lead.interest !== "sin_clasificar" && (
                        <span
                          className={`badge ${lead.interest === "alto" ? "green" : lead.interest === "medio" ? "amber" : "gray"}`}
                        >
                          {lead.interest === "alto"
                            ? "Alto interés"
                            : lead.interest === "medio"
                              ? "Interés medio"
                              : "Interés bajo"}
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
                          "Sin tarea"
                        )}
                      </span>
                      <span className="card-value">{money(lead.deal_amount)}</span>
                    </div>
                  </article>
                ))}
                {cards.length === 0 && (
                  <div className="kanban-empty">Suelta aquí los leads</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

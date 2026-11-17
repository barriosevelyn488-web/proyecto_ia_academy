"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, RotateCcw, X } from "lucide-react";
import {
  AGREEMENTS,
  Lead,
  METHODS,
  ORIGINS,
  PAYMENT_STATUSES,
  PRIORITIES,
  PRODUCTS,
  STAGES,
  money,
  stageLabel,
} from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  AgreementBadge,
  LeadAvatar,
  PaymentStatusBadge,
  PriorityBadge,
  StageBadge,
} from "@/components/ui/crm-primitives";

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
    return (
      <div className="empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
          No hay contactos para mostrar con los filtros seleccionados.
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Prueba cambiando la etapa o limpiando los filtros para ver más prospectos.
        </div>
      </div>
    );

  const limit = showAll ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(leads.length / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const visibleLeads = showAll ? leads.slice(start, start + limit) : leads.slice(0, limit);

  return (
    <>
      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 1200, fontSize: "13px" }}>
          <thead>
            <tr>
              <th style={{ width: 100 }}>Fecha</th>
              <th style={{ width: 130 }}>Número</th>
              <th style={{ minWidth: 160 }}>Nombre</th>
              <th style={{ width: 110 }}>Origen</th>
              <th style={{ width: 130 }}>Producto</th>
              <th style={{ width: 160 }}>Estado (Flujo)</th>
              <th style={{ width: 120 }}>Prioridad</th>
              <th style={{ width: 110 }}>Acuerdo</th>
              <th style={{ width: 140 }}>Gestión de Pago</th>
              <th style={{ width: 90 }}>NIT</th>
              <th style={{ width: 100, textAlign: "right" }}>Monto</th>
              <th style={{ minWidth: 200 }}>Comentarios</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {visibleLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onOpen(lead)}
                style={{ cursor: "pointer", transition: "background 0.15s ease" }}
              >
                {/* Fecha */}
                <td style={{ color: "var(--muted)", whiteSpace: "nowrap", fontSize: "12px" }}>
                  {lead.created_at ? lead.created_at.slice(0, 10) : "—"}
                </td>

                {/* Número / WhatsApp */}
                <td style={{ whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{lead.phone}</span>
                </td>

                {/* Nombre */}
                <td>
                  <div className="person-cell" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LeadAvatar name={lead.full_name} />
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {lead.full_name || "Sin nombre"}
                    </div>
                  </div>
                </td>

                {/* Origen */}
                <td>
                  <span className={`origin-chip ${lead.origin?.toLowerCase()}`}>
                    {lead.origin || "BOT"}
                  </span>
                </td>

                {/* Producto */}
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "#f0f4ff",
                      color: "#2563eb",
                      border: "1px solid #dbeafe",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lead.product || "CODE UP"}
                  </span>
                </td>

                {/* Estado (Flujo de Cierre) */}
                <td>
                  <StageBadge stage={lead.stage} />
                </td>

                {/* Prioridad */}
                <td>
                  <PriorityBadge priority={lead.priority} />
                </td>

                {/* Acuerdo */}
                <td>
                  <AgreementBadge agreement={lead.agreement} />
                </td>

                {/* Gestión de Pago */}
                <td>
                  <PaymentStatusBadge status={lead.payment_status} />
                </td>

                {/* NIT */}
                <td style={{ color: "var(--muted)", fontSize: "12px" }}>
                  {lead.nit || "C/F"}
                </td>

                {/* Monto */}
                <td style={{ textAlign: "right", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
                  {money(lead.deal_amount)}
                </td>

                {/* Comentarios */}
                <td
                  style={{
                    maxWidth: 240,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--muted)",
                    fontSize: "12px",
                  }}
                  title={lead.notes}
                >
                  {lead.notes || "—"}
                </td>

                {/* Botón WhatsApp */}
                <td>
                  <button
                    className="whatsapp-link"
                    title="Abrir chat en WhatsApp"
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
            Mostrando {start + 1}–{Math.min(start + limit, leads.length)} de {leads.length} contactos
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
              Página {safePage} de {totalPages}
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
  origin,
  product,
  priority,
  agreement,
  paymentStatus,
  onOrigin,
  onProduct,
  onPriority,
  onAgreement,
  onPaymentStatus,
  onReset,
}: {
  origin: string;
  product: string;
  priority: string;
  agreement: string;
  paymentStatus: string;
  onOrigin: (value: string) => void;
  onProduct: (value: string) => void;
  onPriority: (value: string) => void;
  onAgreement: (value: string) => void;
  onPaymentStatus: (value: string) => void;
  onReset: () => void;
}) {
  const hasActiveFilters =
    origin !== "todos" ||
    product !== "todos" ||
    priority !== "todos" ||
    agreement !== "todos" ||
    paymentStatus !== "todos";

  return (
    <div
      className="filter-row"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        padding: "12px 16px",
        background: "var(--bg-subtle)",
        borderRadius: 8,
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      {/* Origen */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>Origen:</span>
        <select
          className="select small"
          value={origin}
          onChange={(e) => onOrigin(e.target.value)}
        >
          <option value="todos">Todos</option>
          {ORIGINS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {/* Producto */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>Producto:</span>
        <select
          className="select small"
          value={product}
          onChange={(e) => onProduct(e.target.value)}
        >
          <option value="todos">Todos</option>
          {PRODUCTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {/* Prioridad */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>Prioridad:</span>
        <select
          className="select small"
          value={priority}
          onChange={(e) => onPriority(e.target.value)}
        >
          <option value="todos">Todas</option>
          {PRIORITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {/* Acuerdo */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>Acuerdo:</span>
        <select
          className="select small"
          value={agreement}
          onChange={(e) => onAgreement(e.target.value)}
        >
          <option value="todos">Todos</option>
          {AGREEMENTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {/* Gestión de Pago */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>Gestión de Pago:</span>
        <select
          className="select small"
          value={paymentStatus}
          onChange={(e) => onPaymentStatus(e.target.value)}
        >
          <option value="todos">Todas</option>
          {PAYMENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          className="button small"
          onClick={onReset}
          style={{ marginLeft: "auto", fontSize: 11 }}
        >
          <RotateCcw size={12} /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

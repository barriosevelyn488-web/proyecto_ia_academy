import { useEffect, useState } from "react";
import { Check, MessageCircle, Plus, Settings2, X } from "lucide-react";
import { Lead, METHODS, Payment, PaymentMethod, Stage, STAGES, money } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import { LeadAvatar } from "@/components/ui/crm-primitives";

export function LeadForm({
  lead,
  onClose,
  onSave,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}) {
  const [draft, setDraft] = useState(lead);
  const patch = (key: keyof Lead, value: string | number) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Nuevo lead</div>
            <div className="modal-sub">Agrega una oportunidad al embudo comercial.</div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">
          <LeadFields draft={draft} patch={patch} />
        </div>
        <div className="modal-foot">
          <span className="count-label">Los campos con * son obligatorios.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary">
              <Plus size={14} /> Crear lead
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function LeadFields({
  draft,
  patch,
}: {
  draft: Lead;
  patch: (key: keyof Lead, value: string | number) => void;
}) {
  return (
    <div className="form-grid">
      <label className="form-field">
        <span className="form-label">Nombre completo *</span>
        <input
          className="field"
          required
          value={draft.full_name}
          onChange={(e) => patch("full_name", e.target.value)}
          placeholder="Nombre del contacto"
        />
      </label>
      <label className="form-field">
        <span className="form-label">Teléfono / WhatsApp *</span>
        <input
          className="field"
          required
          type="tel"
          value={draft.phone}
          onChange={(e) => patch("phone", e.target.value)}
          placeholder="+502 0000 0000"
        />
      </label>
      <label className="form-field">
        <span className="form-label">Correo</span>
        <input
          className="field"
          type="email"
          value={draft.email}
          onChange={(e) => patch("email", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span className="form-label">Origen del lead</span>
        <input
          className="field"
          value={draft.origin}
          onChange={(e) => patch("origin", e.target.value)}
          placeholder="Bot, Instagram, referido…"
        />
      </label>
      <label className="form-field">
        <span className="form-label">Producto / programa</span>
        <input
          className="field"
          value={draft.product}
          onChange={(e) => patch("product", e.target.value)}
          placeholder="Taller de IA, Code-Up…"
        />
      </label>
      <label className="form-field">
        <span className="form-label">Etapa</span>
        <select
          className="select"
          value={draft.stage}
          onChange={(e) => patch("stage", e.target.value)}
        >
          {STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Interés</span>
        <select
          className="select"
          value={draft.interest}
          onChange={(e) => patch("interest", e.target.value)}
        >
          <option value="sin_clasificar">Sin clasificar</option>
          <option value="alto">Alto</option>
          <option value="medio">Medio</option>
          <option value="bajo">Bajo</option>
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Precio del trato (GTQ)</span>
        <input
          className="field"
          type="number"
          min="0"
          step="0.01"
          value={draft.deal_amount || ""}
          onChange={(e) => patch("deal_amount", Number(e.target.value))}
          placeholder="0.00"
        />
      </label>
      <label className="form-field">
        <span className="form-label">Método de pago esperado</span>
        <select
          className="select"
          value={draft.payment_method}
          onChange={(e) => patch("payment_method", e.target.value)}
        >
          <option value="">Por definir</option>
          {METHODS.map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Próximo contacto</span>
        <input
          className="field"
          type="date"
          value={draft.next_contact_at}
          onChange={(e) => patch("next_contact_at", e.target.value)}
        />
      </label>
      <label className="form-field full">
        <span className="form-label">Notas de seguimiento</span>
        <textarea
          className="textarea"
          value={draft.notes}
          onChange={(e) => patch("notes", e.target.value)}
          placeholder="Interés, acuerdos, preguntas, siguiente paso…"
        />
      </label>
    </div>
  );
}

export function LeadDetail({
  lead,
  payments,
  onClose,
  onSave,
  onMove,
  onWhatsApp,
  onAddPayment,
  tell,
}: {
  lead: Lead;
  payments: Payment[];
  onClose: () => void;
  onSave: (lead: Lead) => void;
  onMove: (stage: Stage) => void;
  onWhatsApp: () => void;
  onAddPayment: (payment: Omit<Payment, "id" | "created_at">) => Promise<void>;
  tell: (message: string) => void;
}) {
  const [draft, setDraft] = useState(lead);
  const [editing, setEditing] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  useEffect(() => {
    setDraft(lead);
  }, [lead]);
  const patch = (key: keyof Lead, value: string | number) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const received = payments
    .filter((payment) => payment.status === "pagado")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal wide">
        <div className="modal-head">
          <div>
            <div className="eyebrow">Ficha del prospecto</div>
            <div className="detail-header">
              <LeadAvatar name={lead.full_name} />
              <div>
                <div className="detail-name">{lead.full_name}</div>
                <div className="detail-phone">
                  {lead.phone} {lead.email && `· ${lead.email}`}
                </div>
              </div>
              <div className="detail-actions">
                <button className="button small whatsapp-action" onClick={onWhatsApp}>
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button className="button small" onClick={() => setEditing(!editing)}>
                  <Settings2 size={13} />
                  {editing ? "Cancelar edición" : "Editar ficha"}
                </button>
              </div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">
          {editing ? (
            <LeadFields draft={draft} patch={patch} />
          ) : (
            <>
              <div className="detail-grid">
                <div className="detail-stat">
                  <div className="detail-stat-label">Etapa</div>
                  <div className="detail-stat-value">
                    <select
                      className="select stage-select"
                      value={lead.stage}
                      onChange={(e) => onMove(e.target.value as Stage)}
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Origen del lead</div>
                  <div className="detail-stat-value">{lead.origin || "Sin origen"}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Programa de interés</div>
                  <div className="detail-stat-value">{lead.product || "Sin definir"}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Interés</div>
                  <div className="detail-stat-value">
                    {lead.interest === "sin_clasificar"
                      ? "Sin clasificar"
                      : lead.interest}
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Precio del trato</div>
                  <div className="detail-stat-value">{money(lead.deal_amount)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Método de pago esperado</div>
                  <div className="detail-stat-value">
                    {lead.payment_method || "Por definir"}
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Próximo contacto</div>
                  <div className="detail-stat-value">
                    {formatDate(lead.next_contact_at)}
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Ingresos recibidos</div>
                  <div className="detail-stat-value">{money(received)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Fecha de entrada</div>
                  <div className="detail-stat-value">{formatDate(lead.created_at)}</div>
                </div>
              </div>
              <div className="section-label">Notas de seguimiento</div>
              <div className="note-card">
                {lead.notes ||
                  "Todavía no hay notas. Edita la ficha para agregar información importante."}
              </div>
              <div className="section-label section-split">
                <span>Pagos registrados</span>
                <button
                  className="button small"
                  onClick={() => setPaymentOpen(!paymentOpen)}
                >
                  <Plus size={12} /> Añadir pago
                </button>
              </div>
              {paymentOpen && (
                <QuickPayment
                  lead={lead}
                  onCancel={() => setPaymentOpen(false)}
                  onSave={async (payload) => {
                    await onAddPayment(payload);
                    setPaymentOpen(false);
                  }}
                />
              )}
              <div className="payment-list">
                {payments.map((payment) => (
                  <div className="payment-row" key={payment.id}>
                    <span>
                      {payment.reference || "Pago"} · {payment.method}
                    </span>
                    <span
                      className={`badge ${payment.status === "pagado" ? "green" : "amber"}`}
                    >
                      {payment.status === "pagado" ? "Pagado" : "Pendiente"}
                    </span>
                    <strong>{money(payment.amount)}</strong>
                  </div>
                ))}
                {!payments.length && !paymentOpen && (
                  <div className="empty-state">No hay pagos vinculados todavía.</div>
                )}
              </div>
            </>
          )}
        </div>
        {editing && (
          <div className="modal-foot">
            <span className="count-label">
              La información del prospecto se actualizará.
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button
                className="button primary"
                onClick={() => {
                  onSave(draft);
                  setEditing(false);
                }}
              >
                <Check size={14} /> Guardar cambios
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function QuickPayment({
  lead,
  onCancel,
  onSave,
}: {
  lead: Lead;
  onCancel: () => void;
  onSave: (payment: Omit<Payment, "id" | "created_at">) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(
    (lead.payment_method as PaymentMethod) || "Transferencia",
  );
  const [status, setStatus] = useState<Payment["status"]>("pagado");
  const [reference, setReference] = useState("");
  const [due, setDue] = useState("");
  return (
    <form
      className="quick-payment"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          lead_id: lead.id,
          amount: Number(amount),
          method,
          status,
          due_date: status === "pendiente" ? due : "",
          paid_at: status === "pagado" ? new Date().toISOString() : "",
          reference,
        });
      }}
    >
      <label>
        <span className="form-label">Monto</span>
        <input
          className="field"
          required
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="GTQ"
        />
      </label>
      <label>
        <span className="form-label">Método</span>
        <select
          className="select"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="form-label">Estado</span>
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value as Payment["status"])}
        >
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </label>
      <label>
        <span className="form-label">Referencia</span>
        <input
          className="field"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Concepto"
        />
      </label>
      {status === "pendiente" && (
        <label>
          <span className="form-label">Vence</span>
          <input
            className="field"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
      )}
      <div className="quick-payment-actions">
        <button type="button" className="button small" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button primary small">
          <Check size={12} /> Guardar
        </button>
      </div>
    </form>
  );
}

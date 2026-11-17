import { useState } from "react";
import type { FormEvent } from "react";
import { Check, CircleDollarSign, Clock3, HandCoins, Plus, X } from "lucide-react";
import { Lead, METHODS, Payment, PaymentMethod, money } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import { LeadAvatar, Metric, SectionTitle } from "@/components/ui/crm-primitives";

export function PaymentsView({
  payments,
  leads,
  pending,
  revenue,
  onAdd,
  onOpenLead,
  tell,
}: {
  payments: Payment[];
  leads: Lead[];
  pending: number;
  revenue: number;
  onAdd: (payment: Omit<Payment, "id" | "created_at">) => Promise<void>;
  onOpenLead: (id: string) => void;
  tell: (message: string) => void;
}) {
  const [modal, setModal] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Transferencia");
  const [status, setStatus] = useState<Payment["status"]>("pagado");
  const [due, setDue] = useState("");
  const [reference, setReference] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadId || Number(amount) <= 0) {
      tell("Selecciona un contacto e ingresa un monto válido.");
      return;
    }
    await onAdd({
      lead_id: leadId,
      amount: Number(amount),
      method,
      status,
      due_date: status === "pendiente" ? due : "",
      paid_at: status === "pagado" ? new Date().toISOString() : "",
      reference,
    });
    setModal(false);
    setAmount("");
    setReference("");
  };
  return (
    <>
      <div className="metric-grid">
        <Metric
          label="Ingresos cobrados"
          value={money(revenue)}
          foot="Pagos confirmados en el periodo"
          icon={CircleDollarSign}
          tint="#239a78"
        />
        <Metric
          label="Pagos pendientes"
          value={money(pending)}
          foot={`${payments.filter((p) => p.status === "pendiente").length} saldos por cobrar`}
          icon={Clock3}
          tint="#d99526"
        />
        <Metric
          label="Valor total de tratos"
          value={money(
            leads.reduce((sum, lead) => sum + Number(lead.deal_amount || 0), 0),
          )}
          foot={`${leads.length} oportunidades registradas`}
          icon={HandCoins}
          tint="#6557e8"
        />
        <Metric
          label="Inscritos"
          value={leads.filter((lead) => lead.stage === "inscrito").length.toString()}
          foot="Contactos con trato cerrado"
          icon={Check}
          tint="#4e78dd"
        />
      </div>
      <section className="panel table-panel">
        <div style={{ padding: "17px 18px 0" }}>
          <SectionTitle
            title="Registro de pagos"
            subtitle="Pagos y saldos relacionados con cada contacto"
            action={
              <button className="button primary small" onClick={() => setModal(true)}>
                <Plus size={13} /> Registrar pago
              </button>
            }
          />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const lead = leads.find((item) => item.id === payment.lead_id);
                return (
                  <tr key={payment.id} onClick={() => lead && onOpenLead(lead.id)}>
                    <td>
                      <div className="person-cell">
                        <LeadAvatar name={lead?.full_name || "Contacto"} />
                        <div>
                          <div className="person-name">
                            {lead?.full_name || "Lead eliminado"}
                          </div>
                          <div className="person-sub">{lead?.product || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {payment.paid_at
                        ? formatDate(payment.paid_at)
                        : payment.due_date
                          ? `Vence ${formatDate(payment.due_date)}`
                          : formatDate(payment.created_at)}
                    </td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || "—"}</td>
                    <td>
                      <span
                        className={`badge ${payment.status === "pagado" ? "green" : payment.status === "pendiente" ? "amber" : "gray"}`}
                      >
                        <i className="badge-dot" />
                        {payment.status === "pagado"
                          ? "Pagado"
                          : payment.status === "pendiente"
                            ? "Pendiente"
                            : "Anulado"}
                      </span>
                    </td>
                    <td className="deal-total">{money(payment.amount)}</td>
                  </tr>
                );
              })}
              {!payments.length && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Aún no hay pagos registrados. Agrégalos desde aquí o en la ficha del
                    contacto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="modal" onSubmit={submit}>
            <div className="modal-head">
              <div>
                <div className="modal-title">Registrar pago</div>
                <div className="modal-sub">
                  El pago quedará vinculado a la ficha del contacto.
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="form-field full">
                  <span className="form-label">Contacto</span>
                  <select
                    className="select"
                    required
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                  >
                    <option value="">Seleccionar contacto</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.full_name} · {lead.product || "Sin producto"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Monto (GTQ)</span>
                  <input
                    className="field"
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Método de pago</span>
                  <select
                    className="select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    {METHODS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
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
                {status === "pendiente" && (
                  <label className="form-field">
                    <span className="form-label">Fecha de vencimiento</span>
                    <input
                      className="field"
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                )}
                <label className="form-field full">
                  <span className="form-label">Referencia / concepto</span>
                  <input
                    className="field"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Inscripción, abono, saldo…"
                  />
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <span className="count-label">Registra únicamente pagos verificados.</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="button" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button className="button primary">
                  <Check size={14} /> Guardar pago
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

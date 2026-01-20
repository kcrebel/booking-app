"use client";

import { useEffect, useMemo, useState } from "react";

type Staff = {
  id: string;
  displayName: string;
  isActive: boolean;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  isActive: boolean;
  isPublic: boolean;
  staffLinks?: { staff: Staff }[];
};

async function safeReadJson(res: Response) {
  const text = await res.text(); // read once
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __nonJson: true, text };
  }
}

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(v: string) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export default function ServicesPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [price, setPrice] = useState("35.00");
  const [deposit, setDeposit] = useState("0.00");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [staffIds, setStaffIds] = useState<string[]>([]);

  // Edit state
  const [editing, setEditing] = useState<Service | null>(null);

  const activeStaff = useMemo(() => staff.filter((s) => s.isActive), [staff]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [sRes, svcRes] = await Promise.all([
        fetch("/api/staff", { cache: "no-store" }),
        fetch("/api/services", { cache: "no-store" }),
      ]);

      const sData = await safeReadJson(sRes);
      const svcData = await safeReadJson(svcRes);

      if (!sRes.ok || !sData.ok) {
        throw new Error(
          `Staff API failed (${sRes.status}) ` +
            (sData?.error || sData?.text || "Empty/Non-JSON response")
        );
      }

      if (!svcRes.ok || !svcData.ok) {
        throw new Error(
          `Services API failed (${svcRes.status}) ` +
            (svcData?.error || svcData?.text || "Empty/Non-JSON response")
        );
      }

      setStaff(sData.staff);
      setServices(svcData.services);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggleStaffSelected(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          durationMin,
          priceCents: dollarsToCents(price),
          depositCents: dollarsToCents(deposit),
          bufferBeforeMin: bufferBefore,
          bufferAfterMin: bufferAfter,
          staffIds,
        }),
      });

      const data = await safeReadJson(res);

      if (!res.ok || !data.ok) {
        throw new Error(
          `Create service failed (${res.status}) ` +
            (data?.error || data?.text || "Empty/Non-JSON response")
        );
      }

      setName("");
      setDurationMin(30);
      setPrice("35.00");
      setDeposit("0.00");
      setBufferBefore(0);
      setBufferAfter(0);
      setStaffIds([]);

      await loadAll();
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  }

  async function patchService(id: string, patch: any) {
    setError(null);

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await safeReadJson(res);

      if (!res.ok || !data.ok) {
        throw new Error(
          `Update service failed (${res.status}) ` +
            (data?.error || data?.text || "Empty/Non-JSON response")
        );
      }

      await loadAll();
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  }

  function serviceStaffIds(svc: Service) {
    return new Set((svc.staffLinks ?? []).map((x) => x.staff.id));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Services</h1>
      <p style={{ color: "#555" }}>Define services and assign which staff can perform them.</p>

      {error && (
        <div style={{ background: "#fee", border: "1px solid #f99", padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Add service</h2>

        <form onSubmit={createService} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name (required)"
              required
              style={{ padding: 10 }}
            />
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              min={5}
              step={5}
              style={{ padding: 10 }}
              title="Duration (minutes)"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ padding: 10 }}
              title="Price (USD)"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <input
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              style={{ padding: 10 }}
              title="Deposit (USD)"
            />
            <input
              type="number"
              value={bufferBefore}
              onChange={(e) => setBufferBefore(Number(e.target.value))}
              min={0}
              step={5}
              style={{ padding: 10 }}
              title="Buffer before (minutes)"
            />
            <input
              type="number"
              value={bufferAfter}
              onChange={(e) => setBufferAfter(Number(e.target.value))}
              min={0}
              step={5}
              style={{ padding: 10 }}
              title="Buffer after (minutes)"
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Eligible staff</div>
            {activeStaff.length === 0 ? (
              <div style={{ color: "#777" }}>No active staff found. Add staff first.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {activeStaff.map((s) => (
                  <label key={s.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={staffIds.includes(s.id)}
                      onChange={() => toggleStaffSelected(s.id)}
                    />
                    <span>{s.displayName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <button type="submit" style={{ padding: "10px 14px" }}>
              Add service
            </button>
            <button
              type="button"
              onClick={loadAll}
              style={{ padding: "10px 14px", marginLeft: 10 }}
            >
              Refresh
            </button>
          </div>
        </form>
      </div>

      <h2>Existing services</h2>

      {loading ? (
        <div>Loading…</div>
      ) : services.length === 0 ? (
        <div>No services yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {services.map((svc) => {
            const assigned = serviceStaffIds(svc);
            const assignedNames = (svc.staffLinks ?? []).map((x) => x.staff.displayName).join(", ");

            return (
              <div key={svc.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{svc.name}</div>
                    <div style={{ color: "#666" }}>
                      {svc.durationMin} min • ${centsToDollars(svc.priceCents)} • Deposit $
                      {centsToDollars(svc.depositCents)}
                    </div>
                    <div style={{ color: "#666", marginTop: 4 }}>
                      Buffers: {svc.bufferBeforeMin} before / {svc.bufferAfterMin} after
                    </div>
                    <div style={{ color: "#666", marginTop: 4 }}>
                      Staff: {assignedNames || "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setEditing(svc)} style={{ padding: "8px 12px" }}>
                      Edit
                    </button>
                    <button
                      onClick={() => patchService(svc.id, { isActive: !svc.isActive })}
                      style={{ padding: "8px 12px" }}
                    >
                      {svc.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {editing?.id === svc.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                      <input
                        defaultValue={svc.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== svc.name) patchService(svc.id, { name: v });
                        }}
                        style={{ padding: 10 }}
                      />
                      <input
                        type="number"
                        defaultValue={svc.durationMin}
                        min={5}
                        step={5}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== svc.durationMin)
                            patchService(svc.id, { durationMin: v });
                        }}
                        style={{ padding: 10 }}
                      />
                      <input
                        defaultValue={centsToDollars(svc.priceCents)}
                        onBlur={(e) => {
                          const v = dollarsToCents(e.target.value);
                          if (v !== svc.priceCents) patchService(svc.id, { priceCents: v });
                        }}
                        style={{ padding: 10 }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      <input
                        defaultValue={centsToDollars(svc.depositCents)}
                        onBlur={(e) => {
                          const v = dollarsToCents(e.target.value);
                          if (v !== svc.depositCents) patchService(svc.id, { depositCents: v });
                        }}
                        style={{ padding: 10 }}
                      />
                      <input
                        type="number"
                        defaultValue={svc.bufferBeforeMin}
                        min={0}
                        step={5}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== svc.bufferBeforeMin)
                            patchService(svc.id, { bufferBeforeMin: v });
                        }}
                        style={{ padding: 10 }}
                      />
                      <input
                        type="number"
                        defaultValue={svc.bufferAfterMin}
                        min={0}
                        step={5}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== svc.bufferAfterMin)
                            patchService(svc.id, { bufferAfterMin: v });
                        }}
                        style={{ padding: 10 }}
                      />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Eligible staff</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {activeStaff.map((s) => {
                          const checked = assigned.has(s.id);
                          return (
                            <label
                              key={s.id}
                              style={{ display: "flex", gap: 8, alignItems: "center" }}
                            >
                              <input
                                type="checkbox"
                                defaultChecked={checked}
                                onChange={(e) => {
                                  const next = new Set(assigned);
                                  if (e.target.checked) next.add(s.id);
                                  else next.delete(s.id);
                                  patchService(svc.id, { staffIds: Array.from(next) });
                                }}
                              />
                              <span>{s.displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <button onClick={() => setEditing(null)} style={{ padding: "8px 12px" }}>
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

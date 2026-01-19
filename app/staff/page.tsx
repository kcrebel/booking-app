"use client";

import { useEffect, useState } from "react";

type Staff = {
  id: string;
  displayName: string;
  phone: string | null;
  isActive: boolean;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  async function loadStaff() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load staff");
      }

      setStaff(data.staff);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to add staff");
      }

      setEmail("");
      setDisplayName("");
      setPhone("");
      await loadStaff();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  }

  async function updateStaff(id: string, patch: Partial<Staff>) {
    setError(null);

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update staff");
      }

      await loadStaff();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Staff</h1>
      <p style={{ color: "#555" }}>
        Manage team members. (Dev mode — auth comes later.)
      </p>

      {error && (
        <div style={{ background: "#fee", border: "1px solid #f99", padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Add staff */}
      <form onSubmit={addStaff} style={{ marginBottom: 24 }}>
        <h2>Add staff</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: 10 }}
          />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            required
            style={{ padding: 10 }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            style={{ padding: 10 }}
          />
          <button type="submit" style={{ padding: "10px 14px" }}>
            Add
          </button>
        </div>
      </form>

      {/* Staff list */}
      {loading ? (
        <div>Loading…</div>
      ) : staff.length === 0 ? (
        <div>No staff yet.</div>
      ) : (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc" }}>
              <th align="left">Name</th>
              <th align="left">Phone</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>
                  <input
                    defaultValue={s.displayName}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== s.displayName) {
                        updateStaff(s.id, { displayName: v });
                      }
                    }}
                    style={{ width: "100%" }}
                  />
                </td>
                <td>
                  <input
                    defaultValue={s.phone ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (s.phone ?? "")) {
                        updateStaff(s.id, { phone: v || null });
                      }
                    }}
                    style={{ width: "100%" }}
                  />
                </td>
                <td>{s.isActive ? "Active" : "Inactive"}</td>
                <td>
                  <button
                    onClick={() => updateStaff(s.id, { isActive: !s.isActive })}
                  >
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

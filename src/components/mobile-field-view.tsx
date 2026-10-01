"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, CloudOff, LoaderCircle, MapPin, RefreshCw, Send, ShieldAlert, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  listQueuedFieldObservations,
  markQueuedFieldFailure,
  queueFieldObservation,
  removeQueuedFieldObservation,
  type OfflineFieldBody,
  type OfflineFieldItem,
} from "@/lib/offline-field-queue";

async function sendObservation(body: OfflineFieldBody) {
  const session = (await supabase?.auth.getSession())?.data.session;
  if (!session) throw new Error("Authentication session is required.");
  const response = await fetch("/api/hse-operations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ ok: false, error: "HTTP " + response.status }));
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || "Request failed (" + response.status + ")");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return payload.data;
}

export default function MobileFieldView() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState<OfflineFieldItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "unsafe_condition",
    priority: "medium",
    location: "",
    qr_target: "",
    description: "",
    immediate_action: "",
  });

  const refreshQueue = useCallback(async () => {
    try {
      setPending(await listQueuedFieldObservations());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Offline queue unavailable.");
    }
  }, []);

  const sync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setBusy(true);
    setError(null);
    try {
      const rows = await listQueuedFieldObservations();
      let synced = 0;
      for (const item of rows) {
        try {
          await sendObservation(item.body);
          await removeQueuedFieldObservation(item.id);
          synced += 1;
        } catch (caught) {
          const status = typeof caught === "object" && caught && "status" in caught
            ? Number((caught as { status?: number }).status)
            : 0;
          const detail = caught instanceof Error ? caught.message : "Sync failed.";
          if (status >= 400 && status < 500) {
            await markQueuedFieldFailure(item, "Validation: " + detail);
            continue;
          }
          await markQueuedFieldFailure(item, detail);
          break;
        }
      }
      await refreshQueue();
      setLastSync(new Date().toISOString());
      if (synced) {
        setMessage(String(synced) + " queued field observation" + (synced === 1 ? "" : "s") + " synchronized.");
      }
    } finally {
      setBusy(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOnline(navigator.onLine);
      void refreshQueue();
      if (navigator.onLine) void sync();
    }, 0);
    const onOnline = () => {
      setOnline(true);
      void sync();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshQueue, sync]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const body: OfflineFieldBody = {
      resource: "safety_case",
      title: form.description.trim().slice(0, 90) || "Mobile field observation",
      status: "open",
      priority: form.priority,
      payload: {
        client_submission_id: crypto.randomUUID(),
        source: "mobile_field",
        category: form.category,
        location: form.location.trim(),
        qr_target: form.qr_target.trim() || null,
        description: form.description.trim(),
        immediate_action: form.immediate_action.trim() || null,
        captured_at: new Date().toISOString(),
      },
    };

    try {
      if (navigator.onLine) {
        try {
          await sendObservation(body);
          setMessage("Field observation saved to the protected HSE register.");
        } catch (caught) {
          const status = typeof caught === "object" && caught && "status" in caught
            ? Number((caught as { status?: number }).status)
            : 0;
          if (status >= 400 && status < 500) throw caught;
          await queueFieldObservation(body);
          setMessage("Network delivery failed; observation is safely queued on this device.");
        }
      } else {
        await queueFieldObservation(body);
        setMessage("Offline: observation saved on this device and will sync when connectivity returns.");
      }
      setForm({
        category: "unsafe_condition",
        priority: "medium",
        location: "",
        qr_target: "",
        description: "",
        immediate_action: "",
      });
      await refreshQueue();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Observation could not be captured.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="ops-shell">
    <div className="ops-header">
      <div>
        <div className="eyebrow accent-eyebrow">MOBILE FIELD / QR</div>
        <h1>Field Safety Capture</h1>
        <p>Online-first capture with durable IndexedDB queue and idempotent reconciliation.</p>
      </div>
      <div className="overview-header-actions">
        <span className={"status-pill status-" + (online ? "success" : "warning")}>
          {online ? <Wifi size={14} /> : <CloudOff size={14} />} {online ? "Online" : "Offline"}
        </span>
        <button className="secondary-button" disabled={busy || !online} onClick={() => void sync()}>
          <RefreshCw size={14} /> Sync {pending.length ? "(" + pending.length + ")" : ""}
        </button>
      </div>
    </div>

    <div className="ops-kpi-grid">
      <div className="overview-kpi">
        <div className="overview-kpi-icon"><CloudOff size={16} /></div>
        <div><span>Queued locally</span><strong>{pending.length}</strong><small>Persists across refresh/restart</small></div>
      </div>
      <div className="overview-kpi">
        <div className="overview-kpi-icon"><CheckCircle2 size={16} /></div>
        <div><span>Last sync</span><strong>{lastSync ? new Date(lastSync).toLocaleTimeString() : "—"}</strong><small>Automatic on reconnect</small></div>
      </div>
    </div>

    <section className="panel">
      <div className="panel-heading">
        <div><div className="eyebrow">FIELD OBSERVATION</div><h2>Capture hazard / observation</h2></div>
        <ShieldAlert size={20} className="panel-mark" />
      </div>
      {message && <div className="form-success" role="status">{message}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="unsafe_condition">Unsafe Condition</option>
              <option value="unsafe_act">Unsafe Act</option>
              <option value="near_miss">Near Miss</option>
              <option value="hazard">Hazard</option>
              <option value="positive_observation">Positive Observation</option>
              <option value="environmental">Environmental</option>
            </select>
          </label>
          <label>Severity
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <label><MapPin size={14} /> Location
          <input required minLength={2} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Area / line / room" />
        </label>
        <label>QR / asset reference
          <input value={form.qr_target} onChange={(event) => setForm({ ...form, qr_target: event.target.value })} placeholder="Scan result or manual asset reference" />
        </label>
        <label>Description
          <textarea required minLength={10} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the observed condition or behavior." />
        </label>
        <label>Immediate action
          <textarea rows={3} value={form.immediate_action} onChange={(event) => setForm({ ...form, immediate_action: event.target.value })} placeholder="Optional immediate control taken." />
        </label>
        <div className="modal-actions">
          <button className="primary-button" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />} {online ? "Save observation" : "Queue observation"}
          </button>
        </div>
      </form>
    </section>

    {pending.length > 0 && <section className="panel">
      <h2>Pending reconciliation</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Captured</th><th>Subject</th><th>Attempts</th><th>Last error</th></tr></thead>
          <tbody>{pending.map((item) => <tr key={item.id}>
            <td>{new Date(item.created_at).toLocaleString()}</td>
            <td>{item.body.title}</td>
            <td>{item.attempts}</td>
            <td>{item.last_error || "Waiting for connectivity"}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
  </div>;
}

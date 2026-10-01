"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Copy, Link2, LoaderCircle, MessageCircle, Plus, Radio, RefreshCw, Send, UserPlus, XCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";
type Meeting = { id: string; reference_no: string; title: string; description: string | null; scheduled_start: string; scheduled_end: string | null; status: MeetingStatus; access_mode: "authenticated" | "invite_only"; host_id: string; started_at?: string | null; completed_at?: string | null; cancelled_at?: string | null };
type Participant = { id: string; user_id: string | null; invite_email: string | null; display_name: string | null; role: string; status: string; joined_at?: string | null; left_at?: string | null };
type Message = { id: string; sender_id: string; body: string; created_at: string };
type Minutes = { id?: string; content: string; decisions: string | null; action_items: Array<{ title: string; description?: string; priority?: string; due_date?: string | null }> } | null;

type LiveMeetingProps = { user: User };

async function request<T>(path: string, init: RequestInit = {}) {
  if (!supabase) throw new Error("Supabase is not configured in this environment.");
  const session = await supabase.auth.getSession();
  const token = session?.data.session?.access_token;
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
  const payload = await response.json().catch(() => ({ ok: false, error: "The server returned an invalid response." }));
  if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Request failed.");
  return payload.data as T;
}

function statusClass(status: MeetingStatus) {
  return status === "live" ? "status-green" : status === "scheduled" ? "status-blue" : status === "cancelled" ? "status-red" : "status-neutral";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function LiveMeetingView({ user }: LiveMeetingProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [minutes, setMinutes] = useState<Minutes>(null);
  const [message, setMessage] = useState("");
  const [minutesText, setMinutesText] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actionLines, setActionLines] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStart, setCreateStart] = useState("");
  const [createEnd, setCreateEnd] = useState("");
  const [createAccess, setCreateAccess] = useState<"authenticated" | "invite_only">("authenticated");

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<Meeting[]>("/api/live-meetings");
      setMeetings(data);
      setSelected((current) => current ? data.find((item) => item.id === current.id) ?? null : data[0] ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Meetings could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  const loadDetail = useCallback(async (meeting: Meeting) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await request<Meeting & { live_meeting_participants: Participant[]; live_meeting_minutes: Minutes[] }>(`/api/live-meetings/${meeting.id}`);
      setSelected(detail);
      setParticipants(detail.live_meeting_participants ?? []);
      const existingMinutes = detail.live_meeting_minutes?.[0] ?? null;
      setMinutes(existingMinutes);
      setMinutesText(existingMinutes?.content ?? "");
      setDecisions(existingMinutes?.decisions ?? "");
      setActionLines(existingMinutes?.action_items?.map((item) => item.title).join("\n") ?? "");
      const [messageData] = await Promise.all([request<Message[]>(`/api/live-meeting-messages?meeting_id=${meeting.id}`)]);
      setMessages(messageData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Meeting details could not be loaded.");
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void loadMeetings(); }, 0); return () => window.clearTimeout(timer); }, [loadMeetings]);
  useEffect(() => {
    if (!selected?.id) return;
    const meeting = meetings.find((item) => item.id === selected.id);
    if (!meeting) return;
    const timer = window.setTimeout(() => { void loadDetail(meeting); }, 0);
    return () => window.clearTimeout(timer);
  }, [meetings, selected?.id, loadDetail]);
  useEffect(() => {
    const selectedId = selected?.id;
    const client = supabase;
    if (!selectedId || !client) return;
    const channel = client.channel(`live-meeting-${selectedId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "live_meeting_messages", filter: `meeting_id=eq.${selectedId}` }, (payload) => {
      setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new as Message]);
    }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_meetings", filter: `id=eq.${selectedId}` }, (payload) => {
      setSelected((current) => current ? { ...current, ...(payload.new as Meeting) } : current);
      setMeetings((current) => current.map((item) => item.id === selectedId ? { ...item, ...(payload.new as Meeting) } : item));
    }).subscribe();
    return () => { void client.removeChannel(channel); };
  }, [selected?.id]);

  async function createMeeting(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      const result = await request<{ meeting: Meeting; invite_token: string | null }>("/api/live-meetings", { method: "POST", body: JSON.stringify({ title: createTitle, description: createDescription, scheduled_start: new Date(createStart).toISOString(), scheduled_end: createEnd ? new Date(createEnd).toISOString() : null, access_mode: createAccess }) });
      if (result.invite_token) setInviteUrl(`${window.location.origin}/admin/live-meeting?meeting=${result.meeting.id}&invite=${result.invite_token}`);
      setShowCreate(false); setCreateTitle(""); setCreateDescription(""); setCreateStart(""); setCreateEnd(""); await loadMeetings(); setSelected(result.meeting);
    } catch (createError) { setError(createError instanceof Error ? createError.message : "Meeting could not be created."); } finally { setSaving(false); }
  }

  async function lifecycle(status: MeetingStatus) {
    if (!selected) return;
    setSaving(true); setError(null);
    try { await request<Meeting>(`/api/live-meetings/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadMeetings(); const refreshed = meetings.find((item) => item.id === selected.id) ?? selected; await loadDetail({ ...refreshed, status }); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Meeting action failed."); } finally { setSaving(false); }
  }

  async function joinOrLeave(action: "join" | "leave") {
    if (!selected) return;
    setSaving(true); setError(null);
    try { await request(`/api/live-meeting-participants`, { method: "POST", body: JSON.stringify({ meeting_id: selected.id, action }) }); await loadDetail(selected); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Attendance could not be updated."); } finally { setSaving(false); }
  }

  async function inviteParticipant(event: FormEvent) {
    event.preventDefault(); if (!selected || !inviteEmail) return;
    setSaving(true); setError(null);
    try { await request(`/api/live-meeting-participants`, { method: "POST", body: JSON.stringify({ meeting_id: selected.id, invite_email: inviteEmail }) }); setInviteEmail(""); await loadDetail(selected); }
    catch (inviteError) { setError(inviteError instanceof Error ? inviteError.message : "Participant could not be invited."); } finally { setSaving(false); }
  }

  async function rotateInvite() {
    if (!selected) return;
    setSaving(true); setError(null);
    try { const data = await request<{ invite_url: string }>("/api/live-meeting-invite", { method: "POST", body: JSON.stringify({ meeting_id: selected.id }) }); setInviteUrl(data.invite_url); await loadMeetings(); }
    catch (inviteError) { setError(inviteError instanceof Error ? inviteError.message : "Invite link could not be created."); } finally { setSaving(false); }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault(); if (!selected || !message.trim()) return;
    setSaving(true); setError(null);
    try { const data = await request<Message>("/api/live-meeting-messages", { method: "POST", body: JSON.stringify({ meeting_id: selected.id, body: message }) }); setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]); setMessage(""); }
    catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Message could not be sent."); } finally { setSaving(false); }
  }

  async function saveMinutes(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError(null);
    try { const data = await request<{ minutes: Minutes }>("/api/live-meeting-minutes", { method: "PUT", body: JSON.stringify({ meeting_id: selected.id, content: minutesText, decisions, action_items: actionLines.split("\n").map((title) => ({ title, priority: "medium" })) }) }); setMinutes(data.minutes); }
    catch (minutesError) { setError(minutesError instanceof Error ? minutesError.message : "Minutes could not be saved."); } finally { setSaving(false); }
  }

  const myParticipant = useMemo(() => participants.find((item) => item.user_id === user.id), [participants, user.id]);
  return <div className="live-meeting-page">
    <div className="page-header"><div><div className="eyebrow accent-eyebrow">LIVE COLLABORATION</div><h1>Live safety meetings</h1><p>Schedule, host, document, and turn meeting outcomes into traceable HSE actions.</p></div><button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> Create meeting</button></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="live-meeting-toolbar"><button className="secondary-button" onClick={() => void loadMeetings()}><RefreshCw size={15} /> Refresh</button><span className="live-meeting-realtime"><Radio size={15} /> Realtime channel available</span></div>
    {loading ? <div className="state-card"><LoaderCircle className="spin" size={24} /><strong>Loading live meetings…</strong><span>Reading the protected meeting register.</span></div> : meetings.length === 0 ? <div className="state-card"><ClipboardList size={24} /><strong>No live meetings yet</strong><span>Create the first safety meeting to begin attendance, minutes, and action traceability.</span><button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={15} /> Create meeting</button></div> : <div className="live-meeting-grid">
      <section className="panel meeting-list-panel"><div className="panel-heading"><div><div className="eyebrow">MEETING REGISTER</div><h2>Scheduled and live</h2></div><span className="nav-count">{meetings.length}</span></div><div className="meeting-list">{meetings.map((meeting) => <button key={meeting.id} className={`meeting-list-item ${selected?.id === meeting.id ? "selected" : ""}`} onClick={() => setSelected(meeting)}><span className={`status-pill ${statusClass(meeting.status)}`}><span className="status-dot" />{meeting.status}</span><strong>{meeting.title}</strong><span>{meeting.reference_no} · {formatDate(meeting.scheduled_start)}</span></button>)}</div></section>
      {selected && <section className="live-meeting-detail"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">{selected.reference_no} · {selected.access_mode === "invite_only" ? "INVITE ONLY" : "AUTHENTICATED"}</div><h2>{selected.title}</h2><span>{formatDate(selected.scheduled_start)}{selected.scheduled_end ? ` — ${formatDate(selected.scheduled_end)}` : ""}</span></div><span className={`status-pill ${statusClass(selected.status)}`}><span className="status-dot" />{selected.status}</span></div><p className="meeting-description">{selected.description || "No description provided."}</p><div className="meeting-actions">{selected.status === "scheduled" && <button className="primary-button" disabled={saving} onClick={() => void lifecycle("live")}><Radio size={15} /> Start meeting</button>}{selected.status === "live" && <button className="primary-button" disabled={saving} onClick={() => void lifecycle("completed")}><CheckCircle2 size={15} /> Complete meeting</button>}{(selected.status === "scheduled" || selected.status === "live") && <button className="danger-button" disabled={saving} onClick={() => void lifecycle("cancelled")}><XCircle size={15} /> Cancel</button>}{selected.status === "live" && !myParticipant?.joined_at && <button className="secondary-button" disabled={saving} onClick={() => void joinOrLeave("join")}><Radio size={15} /> Join</button>}{myParticipant?.status === "joined" && <button className="secondary-button" disabled={saving} onClick={() => void joinOrLeave("leave")}><XCircle size={15} /> Leave</button>}{selected.access_mode === "invite_only" && <button className="secondary-button" disabled={saving} onClick={() => void rotateInvite()}><Link2 size={15} /> New invite link</button>}</div>{inviteUrl && <div className="invite-box"><Link2 size={15} /><input readOnly value={inviteUrl} aria-label="Secure meeting invite link" /><button className="icon-button" onClick={() => void navigator.clipboard.writeText(inviteUrl)} aria-label="Copy invite link"><Copy size={16} /></button></div>}{detailLoading ? <div className="state-card compact"><LoaderCircle className="spin" size={20} /><strong>Loading meeting workspace…</strong></div> : <div className="meeting-columns"><div><div className="subsection-heading"><UserPlus size={16} /><strong>Attendance</strong></div><form className="inline-form" onSubmit={inviteParticipant}><input type="email" required placeholder="Invite by email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /><button className="secondary-button" disabled={saving}><UserPlus size={14} /> Invite</button></form><div className="participant-list">{participants.map((participant) => <div className="participant-row" key={participant.id}><span className="avatar">{(participant.display_name || participant.invite_email || "?").slice(0, 1).toUpperCase()}</span><span><strong>{participant.display_name || participant.invite_email}</strong><small>{participant.role} · {participant.status}</small></span></div>)}</div></div><div><div className="subsection-heading"><MessageCircle size={16} /><strong>Live discussion</strong></div><div className="message-list">{messages.length === 0 ? <span className="muted-copy">No messages yet.</span> : messages.map((item) => <div className="message-row" key={item.id}><small>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small><span>{item.body}</span></div>)}</div><form className="inline-form" onSubmit={sendMessage}><input required placeholder="Write a message" value={message} onChange={(event) => setMessage(event.target.value)} /><button className="primary-button" disabled={saving} aria-label="Send message"><Send size={14} /></button></form></div></div>} </div></section>}
      {selected && <section className="panel minutes-panel"><div className="panel-heading"><div><div className="eyebrow">CONTROLLED RECORD</div><h2>Meeting minutes</h2></div><ClipboardList size={20} className="panel-mark" /></div><form className="minutes-form" onSubmit={saveMinutes}><label>Discussion summary<textarea required minLength={3} rows={7} value={minutesText} onChange={(event) => setMinutesText(event.target.value)} placeholder="Capture the factual discussion and safety decisions…" /></label><label>Decisions / follow-up<textarea rows={4} value={decisions} onChange={(event) => setDecisions(event.target.value)} placeholder="Record approved decisions and owners…" /></label><label>Action items <span className="field-help">one action title per line; saved to the central HSE action tracker</span><textarea rows={4} value={actionLines} onChange={(event) => setActionLines(event.target.value)} placeholder="Inspect emergency exit signage\nConfirm toolbox talk schedule" /></label><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Save minutes{minutes?.id ? ` · v${minutes.action_items?.length ? minutes.action_items.length : 1}` : ""}</button></form></section>}
    </div>}
    {showCreate && <div className="modal-backdrop" role="presentation"><div className="modal-card"><button className="modal-close" onClick={() => setShowCreate(false)} aria-label="Close"><XCircle size={18} /></button><div className="eyebrow accent-eyebrow">NEW LIVE MEETING</div><h2>Schedule safety meeting</h2><form className="modal-form" onSubmit={createMeeting}><label>Title<input required minLength={3} value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} /></label><label>Description<textarea rows={3} value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} /></label><div className="form-grid"><label>Start<input required type="datetime-local" value={createStart} onChange={(event) => setCreateStart(event.target.value)} /></label><label>End<input type="datetime-local" value={createEnd} onChange={(event) => setCreateEnd(event.target.value)} /></label></div><label>Access mode<select value={createAccess} onChange={(event) => setCreateAccess(event.target.value as "authenticated" | "invite_only")}><option value="authenticated">Authenticated staff</option><option value="invite_only">Invite-only secure link</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Create meeting</button></div></form></div></div>}
  </div>;
}

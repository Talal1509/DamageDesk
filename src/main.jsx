import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, ClipboardList,
  Clock3, FileText, Filter, ImagePlus, LifeBuoy, Plus, Search, ShieldAlert,
  ShieldCheck, CarFront, X, RotateCcw, MessageSquare, CircleDot
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "damagedesk-cases-v1";
const STATUSES = ["New", "Awaiting Evidence", "Ready for Review", "Escalated", "Resolved"];
const EVIDENCE_ITEMS = [
  { key: "beforePhotos", label: "Before-rental photos" },
  { key: "afterPhotos", label: "After-rental photos" },
  { key: "rentalAgreement", label: "Rental agreement" },
  { key: "repairEstimate", label: "Repair estimate" }
];

function dateAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 16);
}

function demoCases() {
  return [
    {
      id: "CLM-1001", booking: "DEMO-201", vehicle: "Honda Civic", registration: "DEMO-CAR-01",
      discoveredAt: dateAgo(1), location: "Front", damageType: "Scratch",
      description: "Light scratch on the front bumper discovered during return inspection.",
      safetyConcern: false, repairCost: "", renterContacted: true,
      evidence: { beforePhotos: true, afterPhotos: true, rentalAgreement: true, repairEstimate: false },
      status: "Ready for Review", priority: "Normal",
      nextAction: "Review the available evidence and determine the appropriate next steps.",
      notes: [{ text: "Return inspection completed. Repair estimate still needed.", at: new Date().toISOString() }],
      resolution: "", createdAt: new Date().toISOString()
    },
    {
      id: "CLM-1002", booking: "DEMO-204", vehicle: "Toyota Camry", registration: "DEMO-CAR-04",
      discoveredAt: dateAgo(0), location: "Rear", damageType: "Dent",
      description: "Visible dent on rear bumper discovered after vehicle return.",
      safetyConcern: false, repairCost: "", renterContacted: false,
      evidence: { beforePhotos: false, afterPhotos: true, rentalAgreement: true, repairEstimate: false },
      status: "Awaiting Evidence", priority: "Normal",
      nextAction: "Request before-rental photos and a repair estimate before review.",
      notes: [{ text: "Initial sample report created. Before-rental photos are missing.", at: new Date().toISOString() }],
      resolution: "", createdAt: new Date().toISOString()
    },
    {
      id: "CLM-1003", booking: "DEMO-198", vehicle: "Kia Sportage", registration: "DEMO-CAR-03",
      discoveredAt: dateAgo(2), location: "Left", damageType: "Broken glass",
      description: "Cracked side window reported during post-rental inspection.",
      safetyConcern: true, repairCost: "", renterContacted: false,
      evidence: { beforePhotos: true, afterPhotos: true, rentalAgreement: false, repairEstimate: false },
      status: "Escalated", priority: "Urgent",
      nextAction: "Keep the vehicle out of service pending an appropriate human safety inspection.",
      notes: [{ text: "Urgent safety review required. Vehicle must not be returned to service until inspected.", at: new Date().toISOString() }],
      resolution: "", createdAt: new Date().toISOString()
    },
    {
      id: "CLM-0998", booking: "DEMO-177", vehicle: "Hyundai Elantra", registration: "DEMO-CAR-02",
      discoveredAt: dateAgo(5), location: "Right", damageType: "Dent",
      description: "Small dent on right rear door; sample review completed.",
      safetyConcern: false, repairCost: "250", renterContacted: true,
      evidence: { beforePhotos: true, afterPhotos: true, rentalAgreement: true, repairEstimate: true },
      status: "Resolved", priority: "Normal",
      nextAction: "Review the recorded outcome if the case is reopened.",
      notes: [{ text: "Evidence checklist complete; demo review finished.", at: new Date().toISOString() }],
      resolution: "Demo review completed. Outcome recorded; no real insurance or liability decision was made.",
      createdAt: new Date().toISOString()
    }
  ];
}

function loadCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoCases();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : demoCases();
  } catch {
    return demoCases();
  }
}

function getMissingEvidence(evidence = {}) {
  return EVIDENCE_ITEMS.filter(item => !evidence[item.key]).map(item => item.label);
}

function triage(form) {
  const missing = getMissingEvidence(form.evidence);
  if (form.safetyConcern) {
    return {
      status: "Escalated", priority: "Urgent",
      nextAction: "Keep the vehicle out of service pending an appropriate human safety inspection. Escalate immediately."
    };
  }
  if (missing.length) {
    return {
      status: "Awaiting Evidence", priority: "Normal",
      nextAction: `Collect missing evidence: ${missing.join(", ")}. Then submit the claim for review.`
    };
  }
  return {
    status: "Ready for Review", priority: "Normal",
    nextAction: "Evidence checklist is complete. Send the claim for human review; do not assume fault or liability."
  };
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function App() {
  const [cases, setCases] = useState(loadCases);
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All statuses");
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }, [cases]);

  const selectedCase = cases.find(c => c.id === selectedId);
  const counts = useMemo(() => ({
    open: cases.filter(c => c.status !== "Resolved").length,
    evidence: cases.filter(c => c.status === "Awaiting Evidence").length,
    review: cases.filter(c => c.status === "Ready for Review").length,
    resolved: cases.filter(c => c.status === "Resolved").length
  }), [cases]);

  const filteredCases = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = [c.id, c.booking, c.vehicle, c.damageType].some(v => String(v || "").toLowerCase().includes(q));
    return matchesSearch && (filterStatus === "All statuses" || c.status === filterStatus);
  }), [cases, search, filterStatus]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function createCase(form) {
    const result = triage(form);
    const nextNum = Math.max(1000, ...cases.map(c => Number((c.id.match(/\d+/) || ["1000"])[0]))) + 1;
    const newCase = {
      ...form, ...result, id: `CLM-${nextNum}`, createdAt: new Date().toISOString(),
      notes: [{ text: "Claim created from the DamageDesk demo.", at: new Date().toISOString() }],
      resolution: ""
    };
    setCases(prev => [newCase, ...prev]);
    setSelectedId(newCase.id);
    setShowForm(false);
    setPage("detail");
    notify(`Claim ${newCase.id} created`);
  }

  function updateCase(id, updater, message = "Claim updated") {
    setCases(prev => prev.map(c => c.id === id ? updater(c) : c));
    notify(message);
  }

  function changeStatus(c, status, resolutionText = "") {
    if (status === "Resolved" && !resolutionText.trim()) {
      notify("Add a resolution note before resolving this claim.");
      return;
    }
    const noteText = status === "Resolved" ? `Resolved: ${resolutionText.trim()}` : `Status changed to ${status}.`;
    updateCase(c.id, old => ({
      ...old, status,
      resolution: status === "Resolved" ? resolutionText.trim() : status === "Resolved" ? old.resolution : old.resolution,
      nextAction: status === "Resolved" ? "Review the recorded outcome if the case is reopened." :
        status === "Escalated" ? (old.safetyConcern ? "Keep vehicle out of service pending human safety inspection." : "Await review by the responsible support or operations team.") :
        status === "Awaiting Evidence" ? `Collect missing evidence: ${getMissingEvidence(old.evidence).join(", ") || "confirm all evidence items"}.` :
        status === "Ready for Review" ? "Review evidence and determine the appropriate next steps." :
        "Review the case details and identify the next action.",
      notes: [...(old.notes || []), { text: noteText, at: new Date().toISOString() }]
    }), `Claim status changed to ${status}`);
  }

  function updateEvidence(c, key, checked) {
    const evidence = { ...c.evidence, [key]: checked };
    const missing = getMissingEvidence(evidence);
    let status = c.status;
    let nextAction = c.nextAction;
    if (c.status !== "Resolved" && c.status !== "Escalated") {
      if (missing.length) {
        status = "Awaiting Evidence";
        nextAction = `Collect missing evidence: ${missing.join(", ")}. Then submit the claim for review.`;
      } else {
        status = "Ready for Review";
        nextAction = "Evidence checklist is complete. Send the claim for human review; do not assume fault or liability.";
      }
    }
    updateCase(c.id, old => ({
      ...old, evidence, status, nextAction,
      notes: [...(old.notes || []), { text: `${EVIDENCE_ITEMS.find(i => i.key === key).label}: marked ${checked ? "received" : "missing"}.`, at: new Date().toISOString() }]
    }), "Evidence checklist updated");
  }

  function addNote(c, text) {
    if (!text.trim()) return notify("Enter a note first.");
    updateCase(c.id, old => ({
      ...old, notes: [...(old.notes || []), { text: text.trim(), at: new Date().toISOString() }]
    }), "Note added to case history");
  }

  function resetDemo() {
    setCases(demoCases());
    setConfirmReset(false);
    setPage("dashboard");
    setSelectedId(null);
    notify("Demo data has been reset");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={22}/></div>
          <div><strong>DamageDesk</strong><small>Claims workspace</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}><ClipboardList size={18}/> Claims dashboard</button>
        <button className="nav-item" onClick={() => { setShowForm(true); setPage("dashboard"); }}><Plus size={18}/> Report new damage</button>
        <div className="sidebar-bottom">
          <div className="demo-notice"><ShieldAlert size={18}/><div><strong>Demo environment</strong><p>Sample data only. No live 1Now connection.</p></div></div>
          <button className="nav-item muted" onClick={() => setConfirmReset(true)}><RotateCcw size={17}/> Reset demo data</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>{page === "detail" ? "Claim details" : "Claims dashboard"}</strong></div>
          <div className="top-actions"><span className="demo-pill"><span/> Demo mode</span><div className="avatar">TK</div></div>
        </header>

        <div className="content">
          {page === "dashboard" && (
            <>
              <div className="page-heading">
                <div><div className="eyebrow">OPERATIONS / SUPPORT</div><h1>Claims dashboard</h1><p>Track vehicle damage reports from intake to resolution.</p></div>
                <button className="primary-btn" onClick={() => setShowForm(true)}><Plus size={17}/> Report new damage</button>
              </div>

              <div className="stat-grid">
                <Stat icon={<ClipboardList/>} label="Open claims" value={counts.open} hint="Require follow-up" />
                <Stat icon={<Clock3/>} label="Awaiting evidence" value={counts.evidence} hint="Information needed" />
                <Stat icon={<Search/>} label="Ready for review" value={counts.review} hint="Evidence checklist complete" />
                <Stat icon={<CheckCircle2/>} label="Resolved" value={counts.resolved} hint="Outcome recorded" />
              </div>

              <section className="panel">
                <div className="panel-heading"><div><h2>Damage claims</h2><p>Review case status and recommended next actions.</p></div><span className="record-count">{filteredCases.length} records</span></div>
                <div className="toolbar">
                  <div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claim, booking or vehicle..." /></div>
                  <div className="select-wrap"><Filter size={16}/><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option>All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={15}/></div>
                </div>
                <div className="table-wrap">
                  <table><thead><tr><th>Claim</th><th>Vehicle</th><th>Damage</th><th>Reported</th><th>Status</th><th>Priority</th><th></th></tr></thead>
                    <tbody>
                      {filteredCases.map(c => <tr key={c.id} onClick={() => { setSelectedId(c.id); setPage("detail"); }} className="clickable-row">
                        <td><strong className="claim-id">{c.id}</strong><small className="subcell">{c.booking}</small></td>
                        <td><div className="vehicle-cell"><div className="vehicle-icon"><CarFront size={18}/></div><span>{c.vehicle}<small>{c.registration}</small></span></div></td>
                        <td>{c.damageType}<small className="subcell">{c.location}</small></td>
                        <td>{fmtDate(c.discoveredAt)}</td>
                        <td><StatusBadge status={c.status}/></td>
                        <td><span className={`priority ${c.priority === "Urgent" ? "urgent" : ""}`}>{c.priority === "Urgent" && <AlertTriangle size={13}/>} {c.priority}</span></td>
                        <td><button className="icon-btn" aria-label={`Open ${c.id}`} onClick={e => { e.stopPropagation(); setSelectedId(c.id); setPage("detail"); }}>→</button></td>
                      </tr>)}
                      {!filteredCases.length && <tr><td colSpan="7"><div className="empty-state"><ClipboardList size={28}/><strong>No claims found</strong><span>Try a different search or report a new claim.</span></div></td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="footer-note"><ShieldAlert size={15}/> Triage is based on operator-entered information. It does not determine fault, liability, or insurance coverage.</div>
            </>
          )}

          {page === "detail" && selectedCase && (
            <ClaimDetail
              claim={selectedCase}
              onBack={() => setPage("dashboard")}
              onStatus={(status, resolution) => changeStatus(selectedCase, status, resolution)}
              onEvidence={(key, checked) => updateEvidence(selectedCase, key, checked)}
              onNote={note => addNote(selectedCase, note)}
            />
          )}
          {page === "detail" && !selectedCase && <div className="empty-state"><strong>Claim not found</strong><button className="secondary-btn" onClick={() => setPage("dashboard")}>Back to dashboard</button></div>}
        </div>
      </main>

      {showForm && <ClaimForm onClose={() => setShowForm(false)} onCreate={createCase}/>}
      {confirmReset && <div className="modal-backdrop"><div className="confirm-modal"><div className="modal-icon warning"><RotateCcw/></div><h2>Reset demo data?</h2><p>This replaces your current browser demo cases with the original sample cases. This cannot be undone.</p><div className="modal-actions"><button className="secondary-btn" onClick={() => setConfirmReset(false)}>Cancel</button><button className="danger-btn" onClick={resetDemo}>Reset data</button></div></div></div>}
      {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  );
}

function Stat({ icon, label, value, hint }) {
  return <div className="stat-card"><div className="stat-top"><div className="stat-icon">{icon}</div><span className="stat-hint">{hint}</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>;
}

function StatusBadge({ status }) {
  const cls = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-badge status-${cls}`}><span/>{status}</span>;
}

function ClaimForm({ onClose, onCreate }) {
  const [form, setForm] = useState({
    booking: "", vehicle: "", registration: "", discoveredAt: new Date().toISOString().slice(0, 16),
    location: "Rear", damageType: "Scratch", description: "", safetyConcern: false,
    repairCost: "", renterContacted: false,
    evidence: { beforePhotos: false, afterPhotos: false, rentalAgreement: false, repairEstimate: false }
  });
  const [error, setError] = useState("");
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateEvidence = (key, value) => setForm(prev => ({ ...prev, evidence: { ...prev.evidence, [key]: value } }));

  function submit(e) {
    e.preventDefault();
    if (!form.booking.trim() || !form.vehicle.trim() || !form.registration.trim() || !form.discoveredAt || !form.description.trim()) {
      setError("Complete all required fields marked with *.");
      return;
    }
    if (form.repairCost && (Number(form.repairCost) < 0 || !Number.isFinite(Number(form.repairCost)))) {
      setError("Repair estimate must be a valid non-negative number.");
      return;
    }
    onCreate({ ...form, booking: form.booking.trim(), vehicle: form.vehicle.trim(), registration: form.registration.trim(), description: form.description.trim() });
  }

  return <div className="modal-backdrop"><div className="form-modal">
    <div className="modal-header"><div><div className="eyebrow">NEW SUPPORT CASE</div><h2>Report vehicle damage</h2><p>Enter the observed details. Use sample information only.</p></div><button className="icon-btn close-btn" onClick={onClose} aria-label="Close"><X/></button></div>
    <form onSubmit={submit}>
      <div className="form-section-title"><span>01</span> Booking & vehicle</div>
      <div className="form-grid">
        <Field label="Booking reference *"><input value={form.booking} onChange={e => update("booking", e.target.value)} placeholder="e.g. DEMO-205" /></Field>
        <Field label="Vehicle make / model *"><input value={form.vehicle} onChange={e => update("vehicle", e.target.value)} placeholder="e.g. Toyota Camry" /></Field>
        <Field label="Registration label *"><input value={form.registration} onChange={e => update("registration", e.target.value)} placeholder="e.g. DEMO-CAR-05" /></Field>
        <Field label="Date/time discovered *"><input type="datetime-local" value={form.discoveredAt} onChange={e => update("discoveredAt", e.target.value)} /></Field>
      </div>
      <div className="form-section-title"><span>02</span> Damage details</div>
      <div className="form-grid">
        <Field label="Damage location"><select value={form.location} onChange={e => update("location", e.target.value)}>{["Front", "Rear", "Left", "Right", "Interior", "Other"].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Damage type"><select value={form.damageType} onChange={e => update("damageType", e.target.value)}>{["Scratch", "Dent", "Broken glass", "Mechanical", "Other"].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Estimated repair cost (optional)"><input type="number" min="0" step="0.01" value={form.repairCost} onChange={e => update("repairCost", e.target.value)} placeholder="Demo estimate only" /></Field>
        <Field label="Renter contacted?"><select value={String(form.renterContacted)} onChange={e => update("renterContacted", e.target.value === "true")}><option value="false">Not yet</option><option value="true">Yes</option></select></Field>
      </div>
      <Field label="Description of observed damage *"><textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe only what was observed; do not assume who caused it." rows="3"/></Field>
      <label className="safety-check"><input type="checkbox" checked={form.safetyConcern} onChange={e => update("safetyConcern", e.target.checked)}/><span><strong>Immediate safety concern</strong><small>Flag the case as urgent for human safety inspection.</small></span></label>
      <div className="form-section-title"><span>03</span> Evidence checklist</div>
      <div className="evidence-form-grid">{EVIDENCE_ITEMS.map(item => <label className="evidence-form-item" key={item.key}><input type="checkbox" checked={form.evidence[item.key]} onChange={e => updateEvidence(item.key, e.target.checked)}/><span>{item.label}</span></label>)}</div>
      <div className="demo-warning"><ShieldAlert size={16}/><span>Demo only. This app does not verify evidence, determine liability, or contact insurers.</span></div>
      {error && <div className="form-error"><AlertTriangle size={16}/>{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn"><Plus size={16}/> Create claim</button></div>
    </form>
  </div></div>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function ClaimDetail({ claim, onBack, onStatus, onEvidence, onNote }) {
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState(claim.resolution || "");
  const missing = getMissingEvidence(claim.evidence);
  const isResolved = claim.status === "Resolved";

  function statusChange(e) {
    const status = e.target.value;
    if (status === "Resolved") {
      if (!resolution.trim()) {
        window.alert("Enter a resolution note before setting this claim to Resolved.");
        e.target.value = claim.status;
        return;
      }
      onStatus(status, resolution);
    } else {
      onStatus(status, "");
    }
  }

  return <div className="detail-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Back to claims</button>
    <div className="page-heading detail-heading"><div><div className="eyebrow">CLAIM / {claim.id}</div><h1>{claim.vehicle} damage report</h1><p>Booking {claim.booking} · Created {fmtDate(claim.createdAt)}</p></div><StatusBadge status={claim.status}/></div>
    <div className="detail-grid">
      <div className="detail-main">
        <section className="panel">
          <div className="panel-heading"><div><h2>Damage summary</h2><p>Operator-reported information</p></div><span className={`priority ${claim.priority === "Urgent" ? "urgent" : ""}`}>{claim.priority === "Urgent" && <AlertTriangle size={13}/>} {claim.priority} priority</span></div>
          <div className="summary-grid">
            <Summary label="Claim ID" value={claim.id}/><Summary label="Vehicle" value={`${claim.vehicle} (${claim.registration})`}/>
            <Summary label="Damage type" value={claim.damageType}/><Summary label="Location" value={claim.location}/>
            <Summary label="Date discovered" value={fmtDate(claim.discoveredAt)}/><Summary label="Renter contacted" value={claim.renterContacted ? "Yes" : "Not yet"}/>
            <Summary label="Repair estimate" value={claim.repairCost ? `${claim.repairCost} (demo amount)` : "Not provided"}/>
          </div>
          <div className="description-block"><strong>Observed damage</strong><p>{claim.description}</p></div>
          {claim.safetyConcern && <div className="urgent-banner"><AlertTriangle size={18}/><div><strong>Immediate safety concern</strong><p>Keep the vehicle out of service pending appropriate human safety inspection.</p></div></div>}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>Evidence checklist</h2><p>Update each item when evidence is received.</p></div><span className="record-count">{EVIDENCE_ITEMS.length - missing.length}/{EVIDENCE_ITEMS.length} complete</span></div>
          <div className="evidence-list">{EVIDENCE_ITEMS.map(item => <label className="evidence-row" key={item.key}><span className={`evidence-icon ${claim.evidence[item.key] ? "received" : ""}`}>{claim.evidence[item.key] ? <Check size={16}/> : <ImagePlus size={16}/>}</span><span className="evidence-copy"><strong>{item.label}</strong><small>{claim.evidence[item.key] ? "Marked as received in demo" : "Missing — follow up required"}</small></span><input type="checkbox" checked={!!claim.evidence[item.key]} disabled={isResolved} onChange={e => onEvidence(item.key, e.target.checked)}/></label>)}</div>
          {missing.length > 0 && !isResolved && <div className="missing-banner"><AlertTriangle size={17}/><div><strong>Evidence required</strong><p>{missing.join(", ")} {missing.length === 1 ? "is" : "are"} still missing. Request these items before review.</p></div></div>}
          {missing.length === 0 && <div className="complete-banner"><CheckCircle2 size={17}/><div><strong>Checklist complete</strong><p>Evidence is marked received in this demo. A human reviewer must still assess the claim.</p></div></div>}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>Case history</h2><p>Notes and status changes recorded in this prototype.</p></div><MessageSquare size={19} className="muted-icon"/></div>
          <div className="history-list">{[...(claim.notes || [])].slice().reverse().map((n, i) => <div className="history-item" key={`${n.at}-${i}`}><div className="history-dot"><CircleDot size={15}/></div><div><p>{n.text}</p><small>{fmtDate(n.at)}</small></div></div>)}</div>
          <div className="add-note"><label className="field"><span>Add internal note</span><textarea rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="Record a follow-up or review note..."/></label><button className="secondary-btn" onClick={() => { onNote(note); setNote(""); }}>Add note</button></div>
        </section>
      </div>

      <aside className="detail-side">
        <section className="panel next-action-panel">
          <div className="side-panel-title"><div className="next-icon"><LifeBuoy size={19}/></div><div><h2>Recommended next action</h2><p>Based on entered information</p></div></div>
          <p className="next-action-text">{claim.nextAction}</p>
          <div className="rule-note"><ShieldAlert size={15}/><span>This is guidance for a demo workflow, not a liability or insurance decision.</span></div>
        </section>
        <section className="panel">
          <div className="panel-heading compact"><div><h2>Manage claim</h2><p>Update the case lifecycle.</p></div></div>
          <Field label="Claim status"><select value={claim.status} onChange={statusChange}>{STATUSES.filter(s => s !== "New" || claim.status === "New").map(s => <option key={s}>{s}</option>)}</select></Field>
          {claim.status === "Resolved" && <button className="secondary-btn full-btn" onClick={() => onStatus("Ready for Review", "")}><RotateCcw size={15}/> Reopen claim</button>}
          {!isResolved && <div className="resolution-field"><Field label="Resolution note (required to resolve)"><textarea rows="3" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe the demo outcome before resolving..."/></Field><button className="primary-btn full-btn" onClick={() => onStatus("Resolved", resolution)}><CheckCircle2 size={16}/> Resolve claim</button></div>}
          <p className="side-hint">Status changes are saved in this browser. Escalation does not notify a real team.</p>
        </section>
      </aside>
    </div>
    <div className="footer-note"><ShieldAlert size={15}/> Demo only: photos and records are not sent to 1Now. Evidence receipt does not prove when or by whom damage occurred.</div>
  </div>;
}

function Summary({ label, value }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);

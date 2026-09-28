/* ==========================================================
   NoteShare - Frontend Logic (Vanilla JS + Fetch API)
   ========================================================== */

const API = "http://localhost:8080";

/* ---------- Icons (inline SVG strings) ---------- */
const ICON = {
    doc: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2zM12 6v14"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    hash: '<svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/></svg>',
    building: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-2 8 2v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
};

/* ---------- State ---------- */
const state = {
    students: [],
    subjects: [],
    notes: [],
    ratings: [],
    view: "dashboard",
    loaded: false,
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Helpers ---------- */
const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const initials = (name) =>
    String(name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const debounce = (fn, ms = 300) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

const isValidUrl = (u) => {
    try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; }
    catch { return false; }
};

const studentName = (id) => state.students.find((s) => s.id === id)?.name || `Student #${id}`;
const subjectOf = (id) => state.subjects.find((s) => s.id === id);
const noteOf = (id) => state.notes.find((n) => n.id === id);

function ratingStatsForNote(noteId) {
    const list = state.ratings.filter((r) => r.noteId === noteId);
    if (!list.length) return { avg: 0, count: 0 };
    const sum = list.reduce((a, r) => a + Number(r.rating || 0), 0);
    return { avg: sum / list.length, count: list.length };
}

/* ---------- API layer ---------- */
async function api(path, options = {}) {
    const res = await fetch(API + path, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data.message || data.error || (Array.isArray(data.errors) ? data.errors.map((e) => e.defaultMessage || e).join(", ") : msg);
        } catch { /* not json */ }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

const RES = {
    students: "/api/students",
    subjects: "/api/subjects",
    notes: "/api/notes",
    ratings: "/api/ratings",
};

const list = (r) => api(RES[r]);
const create = (r, body) => api(RES[r], { method: "POST", body: JSON.stringify(body) });
const update = (r, id, body) => api(`${RES[r]}/${id}`, { method: "PUT", body: JSON.stringify(body) });
const remove = (r, id) => api(`${RES[r]}/${id}`, { method: "DELETE" });
const search = (r, kw) => api(`${RES[r]}/search?keyword=${encodeURIComponent(kw)}`);

/* ---------- Toasts ---------- */
function toast(message, type = "success") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="t-ico">${type === "success" ? ICON.check : ICON.x}</span><span>${esc(message)}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => {
        el.classList.add("out");
        setTimeout(() => el.remove(), 300);
    }, 3400);
}

/* ---------- API status ---------- */
function setStatus(online) {
    const box = $("#apiStatus");
    box.classList.toggle("online", online);
    box.classList.toggle("offline", !online);
    $("#apiStatusText").textContent = online ? "API connected" : "API offline";
}

/* ==========================================================
   DATA LOADING
   ========================================================== */
async function loadAll() {
    showSkeletons();
    try {
        const [students, subjects, notes, ratings] = await Promise.all([
            list("students"), list("subjects"), list("notes"), list("ratings"),
        ]);
        state.students = students || [];
        state.subjects = subjects || [];
        state.notes = notes || [];
        state.ratings = ratings || [];
        state.loaded = true;
        setStatus(true);
    } catch (e) {
        setStatus(false);
        toast("Cannot reach API at " + API, "error");
    }
    renderAll();
}

async function reload(resource) {
    try {
        state[resource] = (await list(resource)) || [];
        setStatus(true);
    } catch (e) {
        setStatus(false);
        toast(e.message, "error");
    }
}

function showSkeletons() {
    const sk = (n) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join("");
    $("#notesGrid").innerHTML = sk(3);
    $("#subjectsGrid").innerHTML = sk(3);
    $("#ratingsGrid").innerHTML = sk(3);
    $("#studentsBody").innerHTML = `<tr><td colspan="5"><div class="sk-line"></div></td></tr>`;
    const line = Array.from({ length: 3 }, () => '<div class="sk-line"></div>').join("");
    $("#recentNotes").innerHTML = line;
    $("#topRated").innerHTML = line;
}

function renderAll() {
    renderDashboard();
    renderStudents(state.students);
    renderSubjects(state.subjects);
    renderNotes(state.notes);
    renderRatings(state.ratings);
}

/* ==========================================================
   RENDER: DASHBOARD
   ========================================================== */
function animateCount(el, to) {
    const start = Number(el.dataset.v || 0);
    const dur = 700;
    const t0 = performance.now();
    const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (to - start) * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
        else el.dataset.v = to;
    };
    requestAnimationFrame(step);
}

function renderDashboard() {
    animateCount($("#statStudents"), state.students.length);
    animateCount($("#statSubjects"), state.subjects.length);
    animateCount($("#statNotes"), state.notes.length);
    animateCount($("#statRatings"), state.ratings.length);

    // Derived, real values (no fake "this week" data)
    const admins = state.students.filter((s) => s.isAdmin).length;
    const depts = new Set(state.subjects.map((s) => (s.department || "").trim()).filter(Boolean)).size;
    const uploaders = new Set(state.notes.map((n) => n.studentId)).size;
    const avg = state.ratings.length
        ? (state.ratings.reduce((a, r) => a + Number(r.rating || 0), 0) / state.ratings.length).toFixed(1)
        : "0.0";

    $("#trendStudents").textContent = `${plural(admins, "admin")}`;
    $("#trendSubjects").textContent = `${plural(depts, "department")}`;
    $("#trendNotes").textContent = `${plural(uploaders, "contributor")}`;
    $("#trendRatings").textContent = `${avg} average`;

    // Recent notes (highest IDs = newest)
    const recent = [...state.notes].sort((a, b) => b.id - a.id).slice(0, 3);
    $("#recentNotes").innerHTML = recent.length
        ? recent.map((n, i) => noteRowHTML(n, i)).join("")
        : emptyHTML("No notes yet", "Add your first note to see it here.", true);

    // Rating distribution
    const total = state.ratings.length;
    const dist = [5, 4, 3, 2, 1].map((s) => {
        const c = state.ratings.filter((r) => Number(r.rating) === s).length;
        return { s, pct: total ? Math.round((c / total) * 100) : 0 };
    });
    $("#ratingDist").innerHTML = dist.map((d) => `
    <div class="dist-row">
      <span class="lbl">${d.s} ${ICON.star}</span>
      <div class="bar"><i data-w="${d.pct}"></i></div>
      <span class="pct">${d.pct}%</span>
    </div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => {
        $$("#ratingDist .bar i").forEach((b) => (b.style.width = b.dataset.w + "%"));
    }));

    // Top rated notes
    const top = state.notes
        .map((n) => ({ n, ...ratingStatsForNote(n.id) }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 5);
    $("#topRated").innerHTML = top.length
        ? top.map((x, i) => {
            const sub = subjectOf(x.n.subjectId);
            return `
        <div class="top-item" data-open-note="${x.n.id}">
          <span class="rank">${i + 1}</span>
          <div class="tbody">
            <b>${esc(x.n.title)}</b>
            ${sub ? `<span class="chip ${i % 2 ? "teal" : ""}">${esc(sub.code)}</span>` : ""}
          </div>
          <span class="stars">${ICON.star}${x.avg.toFixed(1)}</span>
        </div>`;
        }).join("")
        : emptyHTML("No ratings yet", "Rate a note to build the leaderboard.", true);
}

function noteRowHTML(n, i) {
    const sub = subjectOf(n.subjectId);
    const { avg, count } = ratingStatsForNote(n.id);
    const teal = i % 2 === 1;
    return `
  <div class="note-row" data-open-note="${n.id}">
    <div class="doc-ico ${teal ? "teal" : ""}">${ICON.doc}</div>
    <div class="body">
      <div class="top">
        <div style="min-width:0">
          <h4>${esc(n.title)}</h4>
          ${sub ? `<span class="chip ${teal ? "teal" : ""}">${esc(sub.code)}</span>` : ""}
        </div>
        ${count ? `<span class="stars">${ICON.star}${avg.toFixed(1)}</span>` : `<span class="chip grey">No ratings</span>`}
      </div>
      <p class="desc">${esc(n.description)}</p>
      <div class="meta">
        <span>${ICON.user}${esc(studentName(n.studentId))}</span>
        <span>${ICON.hash}Note #${n.id}</span>
      </div>
    </div>
  </div>`;
}

/* ==========================================================
   RENDER: STUDENTS
   ========================================================== */
function renderStudents(items) {
    $("#countStudents").textContent = plural(items.length, "student");
    const body = $("#studentsBody");
    if (!items.length) {
        body.innerHTML = `<tr><td colspan="5">${emptyHTML("No students found", "Try a different search or add a new student.")}</td></tr>`;
        return;
    }
    body.innerHTML = items.map((s, i) => `
    <tr>
      <td class="muted">#${s.id}</td>
      <td><div class="person"><span class="pav ${i % 2 ? "t" : ""}">${esc(initials(s.name))}</span>${esc(s.name)}</div></td>
      <td class="muted">${esc(s.email)}</td>
      <td>${s.isAdmin ? '<span class="chip admin" style="margin:0">Administrator</span>' : '<span class="chip grey" style="margin:0">Student</span>'}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" title="Edit" data-edit="students" data-id="${s.id}">${ICON.edit}</button>
          <button class="icon-btn danger" title="Delete" data-del="students" data-id="${s.id}">${ICON.trash}</button>
        </div>
      </td>
    </tr>`).join("");
}

/* ==========================================================
   RENDER: SUBJECTS
   ========================================================== */
function renderSubjects(items) {
    $("#countSubjects").textContent = plural(items.length, "subject");
    const grid = $("#subjectsGrid");
    if (!items.length) {
        grid.innerHTML = emptyHTML("No subjects found", "Try a different search or add a new subject.");
        return;
    }
    grid.innerHTML = items.map((s, i) => {
        const noteCount = state.notes.filter((n) => n.subjectId === s.id).length;
        const teal = i % 2 === 1;
        return `
    <article class="card glass" style="animation-delay:${Math.min(i, 8) * 40}ms">
      <div class="card-top">
        <div class="doc-ico ${teal ? "teal" : ""}">${ICON.book}</div>
        <div class="cbody">
          <h4>${esc(s.name)}</h4>
          <span class="chip ${teal ? "teal" : ""}">${esc(s.code)}</span>
        </div>
      </div>
      <div class="meta">
        <span>${ICON.building}${esc(s.department)}</span>
        <span>${ICON.cal}${s.semester ? "Semester " + esc(s.semester) : "No semester"}</span>
        <span>${ICON.doc}${plural(noteCount, "note")}</span>
      </div>
      <div class="card-foot">
        <span class="muted" style="font-size:12.5px">ID #${s.id}</span>
        <div class="card-actions">
          <button class="icon-btn" title="Edit" data-edit="subjects" data-id="${s.id}">${ICON.edit}</button>
          <button class="icon-btn danger" title="Delete" data-del="subjects" data-id="${s.id}">${ICON.trash}</button>
        </div>
      </div>
    </article>`;
    }).join("");
}

/* ==========================================================
   RENDER: NOTES
   ========================================================== */
function renderNotes(items) {
    $("#countNotes").textContent = plural(items.length, "note");
    const grid = $("#notesGrid");
    if (!items.length) {
        grid.innerHTML = emptyHTML("No notes found", "Try a different search or add a new note.");
        return;
    }
    grid.innerHTML = items.map((n, i) => {
        const sub = subjectOf(n.subjectId);
        const { avg, count } = ratingStatsForNote(n.id);
        const teal = i % 2 === 1;
        return `
    <article class="card glass" style="animation-delay:${Math.min(i, 8) * 40}ms">
      <div class="card-top">
        <div class="doc-ico ${teal ? "teal" : ""}">${ICON.doc}</div>
        <div class="cbody">
          <h4>${esc(n.title)}</h4>
          ${sub ? `<span class="chip ${teal ? "teal" : ""}">${esc(sub.code)} &middot; ${esc(sub.name)}</span>` : `<span class="chip grey">Subject #${n.subjectId}</span>`}
        </div>
        ${count ? `<span class="stars">${ICON.star}${avg.toFixed(1)}</span>` : ""}
      </div>
      <p class="desc">${esc(n.description)}</p>
      <div class="meta">
        <span>${ICON.user}${esc(studentName(n.studentId))}</span>
        <span>${ICON.star}${plural(count, "rating")}</span>
      </div>
      <div class="card-foot">
        <a class="open-link" href="${esc(n.fileUrl)}" target="_blank" rel="noopener noreferrer">Open note ${ICON.link}</a>
        <div class="card-actions">
          <button class="icon-btn" title="Rate this note" data-rate="${n.id}">${ICON.star}</button>
          <button class="icon-btn" title="Edit" data-edit="notes" data-id="${n.id}">${ICON.edit}</button>
          <button class="icon-btn danger" title="Delete" data-del="notes" data-id="${n.id}">${ICON.trash}</button>
        </div>
      </div>
    </article>`;
    }).join("");
}

/* ==========================================================
   RENDER: RATINGS
   ========================================================== */
function starRow(n) {
    return `<span class="star-row">${[1, 2, 3, 4, 5].map((i) => ICON.star.replace("<svg", `<svg class="${i <= n ? "on" : ""}"`)).join("")}</span>`;
}

function renderRatings(items) {
    $("#countRatings").textContent = plural(items.length, "rating");
    const grid = $("#ratingsGrid");
    if (!items.length) {
        grid.innerHTML = emptyHTML("No ratings found", "Try a different search or add a new rating.");
        return;
    }
    grid.innerHTML = items.map((r, i) => {
        const note = noteOf(r.noteId);
        return `
    <article class="card glass" style="animation-delay:${Math.min(i, 8) * 40}ms">
      <div class="card-top">
        <div class="score-badge">${Number(r.rating)}</div>
        <div class="cbody">
          ${starRow(Number(r.rating))}
          <h4 style="margin-top:6px">${note ? esc(note.title) : "Note #" + r.noteId}</h4>
        </div>
      </div>
      <p class="quote ${r.comment ? "" : "empty"}">${r.comment ? "&ldquo;" + esc(r.comment) + "&rdquo;" : "No comment provided"}</p>
      <div class="meta">
        <span>${ICON.user}${esc(studentName(r.studentId))}</span>
        <span>${ICON.hash}Rating #${r.id}</span>
      </div>
      <div class="card-foot">
        <span></span>
        <div class="card-actions">
          <button class="icon-btn" title="Edit" data-edit="ratings" data-id="${r.id}">${ICON.edit}</button>
          <button class="icon-btn danger" title="Delete" data-del="ratings" data-id="${r.id}">${ICON.trash}</button>
        </div>
      </div>
    </article>`;
    }).join("");
}

function emptyHTML(title, sub, small = false) {
    return `<div class="empty ${small ? "small" : ""}"><div class="e-ico">${ICON.doc}</div><b>${esc(title)}</b>${esc(sub)}</div>`;
}

/* ==========================================================
   NAVIGATION
   ========================================================== */
const ADD_LABEL = { dashboard: "note", students: "student", subjects: "subject", notes: "note", ratings: "rating" };

function go(view) {
    state.view = view;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
    $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === view));
    const kind = ADD_LABEL[view];
    $("#topAddLabel").textContent = "Add " + kind.charAt(0).toUpperCase() + kind.slice(1);
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================================
   MODAL FORMS
   ========================================================== */
const FORMS = {
    students: {
        title: "Student",
        fields: [
            { name: "name", label: "Full name", type: "text", required: true, placeholder: "e.g. Sudharsan Kumar" },
            { name: "email", label: "Email address", type: "email", required: true, placeholder: "name@example.com" },
            { name: "isAdmin", label: "Administrator", type: "switch", hint: "Grant administrator privileges" },
        ],
    },
    subjects: {
        title: "Subject",
        fields: [
            { name: "name", label: "Subject name", type: "text", required: true, placeholder: "e.g. Digital Electronics" },
            { row: [
                    { name: "code", label: "Subject code", type: "text", required: true, placeholder: "EC3351" },
                    { name: "semester", label: "Semester", type: "text", placeholder: "III (optional)" },
                ] },
            { name: "department", label: "Department", type: "text", required: true, placeholder: "e.g. ECE" },
        ],
    },
    notes: {
        title: "Note",
        fields: [
            { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Digital Electronics Unit 1 Notes" },
            { name: "description", label: "Description", type: "textarea", required: true, placeholder: "What do these notes cover?" },
            { name: "fileUrl", label: "File URL", type: "url", required: true, placeholder: "https://example.com/notes/file.pdf" },
            { row: [
                    { name: "studentId", label: "Uploaded by", type: "select", required: true, source: "students", optLabel: (s) => s.name },
                    { name: "subjectId", label: "Subject", type: "select", required: true, source: "subjects", optLabel: (s) => `${s.code} - ${s.name}` },
                ] },
        ],
    },
    ratings: {
        title: "Rating",
        fields: [
            { name: "noteId", label: "Note", type: "select", required: true, source: "notes", optLabel: (n) => n.title },
            { name: "studentId", label: "Rated by", type: "select", required: true, source: "students", optLabel: (s) => s.name },
            { name: "rating", label: "Rating", type: "stars", required: true },
            { name: "comment", label: "Comment", type: "textarea", placeholder: "Share your feedback (optional)" },
        ],
    },
};

let modalCtx = null; // { resource, id }

function fieldHTML(f, values) {
    if (f.row) return `<div class="field-row">${f.row.map((x) => fieldHTML(x, values)).join("")}</div>`;
    const v = values[f.name];
    const req = f.required ? "<em>*</em>" : "";

    if (f.type === "switch") {
        return `
    <div class="field toggle-field">
      <div class="tl"><b>${f.label}</b><small>${f.hint || ""}</small></div>
      <label class="switch"><input type="checkbox" name="${f.name}" ${v ? "checked" : ""} /><span></span></label>
    </div>`;
    }

    if (f.type === "stars") {
        const cur = Number(v || 0);
        return `
    <div class="field" data-field="${f.name}">
      <label>${f.label} ${req}</label>
      <div class="star-input" id="starInput" data-value="${cur}">
        ${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-star="${i}" class="${i <= cur ? "on" : ""}" aria-label="${i} star">${ICON.star}</button>`).join("")}
      </div>
      <input type="hidden" name="${f.name}" value="${cur || ""}" />
      <span class="err">Please choose a rating from 1 to 5</span>
    </div>`;
    }

    let input = "";
    if (f.type === "textarea") {
        input = `<textarea name="${f.name}" placeholder="${esc(f.placeholder || "")}">${esc(v ?? "")}</textarea>`;
    } else if (f.type === "select") {
        const opts = state[f.source].map((o) => `<option value="${o.id}" ${Number(v) === o.id ? "selected" : ""}>${esc(f.optLabel(o))}</option>`).join("");
        input = `<select name="${f.name}"><option value="">Select...</option>${opts}</select>`;
    } else {
        input = `<input type="${f.type}" name="${f.name}" value="${esc(v ?? "")}" placeholder="${esc(f.placeholder || "")}" autocomplete="off" />`;
    }
    return `
  <div class="field" data-field="${f.name}">
    <label>${f.label} ${req}</label>
    ${input}
    <span class="err"></span>
  </div>`;
}

function openModal(resource, id = null, preset = {}) {
    const cfg = FORMS[resource];
    const editing = id !== null;

    if (resource === "notes" && (!state.students.length || !state.subjects.length)) {
        toast("Add at least one student and one subject first", "error");
        return;
    }
    if (resource === "ratings" && (!state.students.length || !state.notes.length)) {
        toast("Add at least one student and one note first", "error");
        return;
    }

    const values = editing
        ? { ...state[resource].find((x) => x.id === id) }
        : { ...preset };

    modalCtx = { resource, id };
    $("#modalTitle").textContent = `${editing ? "Edit" : "Add"} ${cfg.title}`;
    $("#modalSubmit").textContent = editing ? "Save changes" : `Add ${cfg.title.toLowerCase()}`;
    $("#modalBody").innerHTML = cfg.fields.map((f) => fieldHTML(f, values)).join("");
    $("#modalBackdrop").classList.add("open");
    setTimeout(() => $("#modalBody input:not([type=hidden]), #modalBody select, #modalBody textarea")?.focus(), 80);
}

function closeModal() {
    $("#modalBackdrop").classList.remove("open");
    modalCtx = null;
}

function setFieldError(name, msg) {
    const wrap = $(`.field[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.add("invalid");
    const e = $(".err", wrap);
    if (msg && e) e.textContent = msg;
}

function collectAndValidate(resource) {
    const cfg = FORMS[resource];
    const flat = cfg.fields.flatMap((f) => (f.row ? f.row : [f]));
    const form = $("#modalForm");
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));

    const data = {};
    let ok = true;

    for (const f of flat) {
        const el = form.elements[f.name];
        if (f.type === "switch") { data[f.name] = el.checked; continue; }

        let val = (el.value || "").trim();

        if (f.required && !val) {
            setFieldError(f.name, `${f.label} is required`);
            ok = false; continue;
        }

        if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            setFieldError(f.name, "Enter a valid email address");
            ok = false; continue;
        }
        if (f.type === "url" && val && !isValidUrl(val)) {
            setFieldError(f.name, "Enter a valid URL starting with http:// or https://");
            ok = false; continue;
        }

        if (f.type === "select") data[f.name] = val ? Number(val) : null;
        else if (f.type === "stars") data[f.name] = val ? Number(val) : null;
        else data[f.name] = val === "" ? (f.required ? val : null) : val;
    }

    if (resource === "ratings" && data.rating !== null && (data.rating < 1 || data.rating > 5)) {
        setFieldError("rating", "Rating must be between 1 and 5");
        ok = false;
    }

    return ok ? data : null;
}

async function submitModal(e) {
    e.preventDefault();
    if (!modalCtx) return;
    const { resource, id } = modalCtx;
    const data = collectAndValidate(resource);
    if (!data) return;

    const btn = $("#modalSubmit");
    const label = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
        if (id !== null) await update(resource, id, data);
        else await create(resource, data);
        toast(`${FORMS[resource].title} ${id !== null ? "updated" : "added"} successfully`);
        closeModal();
        await refreshAfterChange(resource);
    } catch (err) {
        toast(err.message || "Something went wrong", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = label;
    }
}

/* Reload affected data + re-render everything that depends on it */
async function refreshAfterChange(resource) {
    await reload(resource);
    // Cross-resource dependencies (names/codes shown in cards)
    if (resource === "notes" || resource === "ratings") await Promise.all([reload("notes"), reload("ratings")]);
    renderAll();
    reapplySearch();
}

/* ==========================================================
   DELETE (with confirmation)
   ========================================================== */
let pendingDelete = null;

const DELETE_TEXT = {
    students: "This student will be permanently removed.",
    subjects: "This subject will be permanently removed.",
    notes: "This note will be permanently removed.",
    ratings: "This rating will be permanently removed.",
};

function askDelete(resource, id) {
    pendingDelete = { resource, id };
    $("#confirmText").textContent = DELETE_TEXT[resource] + " This action cannot be undone.";
    $("#confirmBackdrop").classList.add("open");
}

function closeConfirm() {
    $("#confirmBackdrop").classList.remove("open");
    pendingDelete = null;
}

async function confirmDelete() {
    if (!pendingDelete) return;
    const { resource, id } = pendingDelete;
    const btn = $("#confirmYes");
    btn.disabled = true;
    try {
        await remove(resource, id);
        toast("Deleted successfully");
        closeConfirm();
        await refreshAfterChange(resource);
    } catch (err) {
        toast(err.message || "Delete failed", "error");
    } finally {
        btn.disabled = false;
    }
}

/* ==========================================================
   SEARCH (server-side endpoints, debounced)
   ========================================================== */
const SEARCH_CFG = {
    students: { input: "#searchStudents", render: renderStudents },
    subjects: { input: "#searchSubjects", render: renderSubjects },
    notes: { input: "#searchNotes", render: renderNotes },
    ratings: { input: "#searchRatings", render: renderRatings },
};

async function runSearch(resource) {
    const { input, render } = SEARCH_CFG[resource];
    const kw = $(input).value.trim();
    if (!kw) { render(state[resource]); return; }
    try {
        render((await search(resource, kw)) || []);
    } catch (e) {
        toast(e.message, "error");
    }
}

function reapplySearch() {
    Object.keys(SEARCH_CFG).forEach((r) => { if ($(SEARCH_CFG[r].input).value.trim()) runSearch(r); });
}

/* Global search: jumps to Notes and searches there; falls back to other modules */
const globalSearch = debounce(async () => {
    const kw = $("#globalSearch").value.trim();
    if (!kw) return;
    try {
        const [notes, subjects, students] = await Promise.all([
            search("notes", kw), search("subjects", kw), search("students", kw),
        ]);
        let target = "notes";
        if (!notes.length && subjects.length) target = "subjects";
        else if (!notes.length && !subjects.length && students.length) target = "students";

        go(target);
        const cfg = SEARCH_CFG[target];
        $(cfg.input).value = kw;
        cfg.render({ notes, subjects, students }[target]);
        if (!notes.length && !subjects.length && !students.length) toast("No results found for \"" + kw + "\"", "error");
    } catch (e) {
        toast(e.message, "error");
    }
}, 450);

/* ==========================================================
   EVENTS
   ========================================================== */
function bindEvents() {
    // Sidebar navigation
    $$(".nav-item").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
    $("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

    // Delegated clicks
    document.addEventListener("click", (e) => {
        const t = e.target;

        const goto = t.closest("[data-goto]");
        if (goto) return go(goto.dataset.goto);

        const quick = t.closest("[data-quick]");
        if (quick) {
            const map = { note: "notes", student: "students", subject: "subjects", rating: "ratings" };
            return openModal(map[quick.dataset.quick]);
        }

        const edit = t.closest("[data-edit]");
        if (edit) return openModal(edit.dataset.edit, Number(edit.dataset.id));

        const del = t.closest("[data-del]");
        if (del) return askDelete(del.dataset.del, Number(del.dataset.id));

        const rate = t.closest("[data-rate]");
        if (rate) return openModal("ratings", null, { noteId: Number(rate.dataset.rate) });

        const openNote = t.closest("[data-open-note]");
        if (openNote) {
            const n = noteOf(Number(openNote.dataset.openNote));
            if (n && isValidUrl(n.fileUrl)) window.open(n.fileUrl, "_blank", "noopener");
            return;
        }

        const star = t.closest("[data-star]");
        if (star) {
            const val = Number(star.dataset.star);
            const box = star.closest(".star-input");
            $$("[data-star]", box).forEach((b) => b.classList.toggle("on", Number(b.dataset.star) <= val));
            $('#modalForm input[name="rating"]').value = val;
            star.closest(".field").classList.remove("invalid");
        }
    });

    // Top add button follows current view
    $("#topAddBtn").addEventListener("click", () => {
        const map = { dashboard: "notes", students: "students", subjects: "subjects", notes: "notes", ratings: "ratings" };
        openModal(map[state.view]);
    });

    // Modal
    $("#modalForm").addEventListener("submit", submitModal);
    $("#modalClose").addEventListener("click", closeModal);
    $("#modalCancel").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("mousedown", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });

    // Confirm
    $("#confirmNo").addEventListener("click", closeConfirm);
    $("#confirmYes").addEventListener("click", confirmDelete);
    $("#confirmBackdrop").addEventListener("mousedown", (e) => { if (e.target.id === "confirmBackdrop") closeConfirm(); });

    // ESC to close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { closeModal(); closeConfirm(); $("#sidebar").classList.remove("open"); }
    });

    // Search inputs
    Object.keys(SEARCH_CFG).forEach((r) => {
        $(SEARCH_CFG[r].input).addEventListener("input", debounce(() => runSearch(r), 300));
    });
    $("#globalSearch").addEventListener("input", globalSearch);
    $("#globalSearch").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); globalSearch(); }
    });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadAll();
});
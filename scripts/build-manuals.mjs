import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const MANUALS_DIR = path.resolve('docs/manuals')
const JSON_DATA = path.resolve('docs/manuals/extracted_dom_and_api.json')

fs.mkdirSync(MANUALS_DIR, { recursive: true })

const extractedData = JSON.parse(fs.readFileSync(JSON_DATA, 'utf8'))

function domSummary(dom) {
  const parts = []
  if (dom.buttons && dom.buttons.length > 0) {
    const btns = dom.buttons.filter((b) => !['Toggle navigation', '9+', 'Sign out'].includes(b.label))
    if (btns.length > 0)
      parts.push(
        '<div class="dom-section"><strong>Buttons:</strong> ' +
          btns
            .map((b) => `<span class="dom-chip btn-chip">${b.label}${b.disabled ? ' [disabled]' : ''}</span>`)
            .join(' ') +
          '</div>',
      )
  }
  if (dom.inputs && dom.inputs.length > 0) {
    const inputs = dom.inputs.filter((i) => i.placeholder !== 'Search student name\u2026')
    if (inputs.length > 0)
      parts.push(
        '<div class="dom-section"><strong>Inputs:</strong> ' +
          inputs
            .map((i) => `<span class="dom-chip input-chip">${i.placeholder || i.ariaLabel || i.name || i.type}</span>`)
            .join(' ') +
          '</div>',
      )
  }
  if (dom.selects && dom.selects.length > 0)
    parts.push(
      '<div class="dom-section"><strong>Selects:</strong> ' +
        dom.selects
          .map(
            (s) =>
              `<span class="dom-chip select-chip">${s.id}: [${(s.options || []).slice(0, 4).join(', ')}${(s.options || []).length > 4 ? '..' : ''}]</span>`,
          )
          .join(' ') +
        '</div>',
    )
  if (dom.tabs && dom.tabs.length > 0)
    parts.push(
      '<div class="dom-section"><strong>Tabs:</strong> ' +
        dom.tabs.map((t) => `<span class="dom-chip tab-chip">${t}</span>`).join(' > ') +
        '</div>',
    )
  return parts.length ? `<div class="dom-summary">${parts.join('')}</div>` : ''
}

const CSS = `
:root {
  --bg-body: #f8fafc;
  --bg-card: #ffffff;
  --bg-subtle: #f8fafc;
  --text-main: #1e293b;
  --text-title: #0f172a;
  --text-muted: #64748b;
  --border-color: #cbd5e1;
  --border-subtle: #e2e8f0;
  --table-stripe: #f8fafc;
  --table-border: #e2e8f0;
  --card-shadow: 0 4px 20px rgba(0,0,0,.08);
  --cover-bg: linear-gradient(145deg, #f8fafc 0%, #f0f4ff 100%);
  --chip-border: #cbd5e1;
  --code-bg: #f1f5f9;
}

[data-theme="dark"] {
  --bg-body: #0b0f19;
  --bg-card: #151d2f;
  --bg-subtle: #1c263c;
  --text-main: #cbd5e1;
  --text-title: #f1f5f9;
  --text-muted: #94a3b8;
  --border-color: #334155;
  --border-subtle: #1e293b;
  --table-stripe: #192238;
  --table-border: #29354f;
  --card-shadow: 0 6px 25px rgba(0,0,0,.5);
  --cover-bg: linear-gradient(145deg, #101726 0%, #17223b 100%);
  --chip-border: #334155;
  --code-bg: #0d1321;
}

@page {
  size: A4 portrait;
  margin: 14mm 14mm 16mm 14mm;
}
@page:first {
  margin: 0;
}
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
html {
  scroll-behavior: smooth;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-main);
  background: var(--bg-card);
  line-height: 1.5;
  font-size: 11.5px;
  margin: 0;
  padding: 0;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.page-break {
  page-break-before: always;
  break-before: page;
}
.avoid-break {
  page-break-inside: avoid;
  break-inside: avoid;
}
h1, h2, h3, h4, .section-title, .flow-title, .sub-title {
  page-break-after: avoid;
  break-after: avoid;
}
table, tr, td, th {
  page-break-inside: avoid;
  break-inside: avoid;
}
.cover {
  min-height: 94vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 32px;
  border: 2px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--cover-bg);
}
.logo-badge {
  background: #1e3a8a;
  color: #fff;
  padding: 10px 18px;
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 2px;
  border-radius: 8px;
  display: inline-block;
}
.cover-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}
.cover-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 800;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.cover h1 {
  font-size: 30px;
  font-weight: 900;
  color: var(--text-title);
  line-height: 1.2;
  margin: 0 0 14px 0;
}
.cover-subtitle {
  font-size: 13.5px;
  color: var(--text-muted);
  max-width: 580px;
}
.cover-meta {
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: var(--bg-card);
  padding: 18px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}
.meta-item strong {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 2px;
}
.meta-item span {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
.cover-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
  font-size: 10.5px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}
.toc-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-title);
  margin: 0 0 18px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-subtle);
}
.toc-section {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.toc-section a {
  text-decoration: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 12px;
  transition: color 0.15s;
}
.toc-section a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}
.toc-dots {
  flex: 1;
  border-bottom: 1px dotted var(--border-color);
  margin: 0 8px;
}
.toc-page {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}
.toc-sub {
  margin-left: 16px;
  margin-top: 2px;
}
.toc-sub a {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}
h2.section-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-title);
  margin: 32px 0 8px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-num {
  background: #2563eb;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  min-width: 28px;
  text-align: center;
}
h3.flow-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-title);
  margin: 18px 0 5px 0;
}
h4.sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
  margin: 12px 0 4px 0;
}
p.desc {
  color: var(--text-muted);
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 11.5px;
}
.route-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-family: monospace;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.route-pill:hover {
  border-color: #2563eb;
  color: #2563eb;
}
.permission-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-left: 8px;
}
.permission-admin { background: #fef2f2; color: #dc2626; }
.permission-staff { background: #f0fdf4; color: #16a34a; }
.permission-both { background: #eff6ff; color: #2563eb; }
.screenshot-box {
  margin: 12px 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-subtle);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  cursor: zoom-in;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.screenshot-box:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
}
.screenshot-box img {
  width: 100%;
  height: auto;
  display: block;
}
.screenshot-caption {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 6px 12px;
  background: var(--bg-subtle);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.zoom-hint {
  font-size: 9px;
  font-weight: 600;
  color: #2563eb;
  opacity: 0.85;
}
[data-theme="dark"] .zoom-hint {
  color: #60a5fa;
}
table.steps-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 11px;
}
table.steps-table th {
  background: var(--bg-subtle);
  color: var(--text-title);
  text-align: left;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  font-weight: 700;
  font-size: 10.5px;
}
table.steps-table td {
  padding: 7px 10px;
  border: 1px solid var(--border-subtle);
  vertical-align: top;
  color: var(--text-main);
}
table.steps-table tr:nth-child(even) td {
  background: var(--table-stripe);
}
.badge-callout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  background: #e11d48;
  color: #fff;
  border-radius: 50%;
  font-weight: 800;
  font-size: 10.5px;
}
.btn-name {
  font-weight: 700;
  color: var(--text-title);
}
table.api-table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 10.5px;
}
table.api-table th {
  background: #0f172a;
  color: #e2e8f0;
  padding: 5px 10px;
  text-align: left;
  font-size: 10px;
}
table.api-table td {
  padding: 5px 10px;
  border: 1px solid var(--border-subtle);
  font-family: monospace;
  color: var(--text-main);
}
table.api-table tr:nth-child(even) td {
  background: var(--table-stripe);
}
.method-get { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 9.5px; }
.method-post { background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 9.5px; }
.method-delete { background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 9.5px; }
.method-put { background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 9.5px; }
.dom-summary {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  margin: 8px 0;
  font-size: 10.5px;
}
.dom-section { margin-bottom: 5px; }
.dom-chip { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10px; margin: 1px 2px; }
.btn-chip { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.input-chip { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.select-chip { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.tab-chip { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }
.callout-box { padding: 9px 13px; border-radius: 6px; margin: 10px 0; font-size: 11px; }
.callout-tip { background: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; }
.callout-warning { background: #fefce8; border-left: 4px solid #ca8a04; color: #854d0e; }
.callout-important { background: #eff6ff; border-left: 4px solid #2563eb; color: #1e40af; }
[data-theme="dark"] .callout-tip { background: #064e3b; color: #a7f3d0; border-left-color: #10b981; }
[data-theme="dark"] .callout-warning { background: #451a03; color: #fde68a; border-left-color: #f59e0b; }
[data-theme="dark"] .callout-important { background: #172554; color: #bfdbfe; border-left-color: #3b82f6; }
.callout-title { font-weight: 700; margin-bottom: 2px; }
.sitemap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin: 12px 0; }
.sitemap-node { border: 1px solid var(--border-color); border-radius: 6px; padding: 9px 11px; background: var(--bg-subtle); }
.sitemap-node-header { font-weight: 700; font-size: 11.5px; color: #2563eb; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center; }
.sitemap-node-path { font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
.sitemap-node ul { margin: 4px 0 0 14px; padding: 0; font-size: 10.5px; color: var(--text-main); }
.modal-spec { background: var(--bg-subtle); border: 1px solid #e9d5ff; border-radius: 6px; padding: 10px 12px; margin: 10px 0; }
.modal-spec h4 { color: #9333ea; margin: 0 0 8px 0; font-size: 12px; }
.field-list { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0; }
.field-tag { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; border-radius: 10px; padding: 1px 8px; font-size: 10px; }

/* Process Flowchart Pipelines */
.diagram-wrapper {
  margin: 14px 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.diagram-header {
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.3px;
}
[data-theme="dark"] .diagram-header {
  color: #60a5fa;
}
.flow-diagram {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--bg-card);
}
.flow-step-card {
  flex: 1 1 110px;
  min-width: 105px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.flow-step-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
}
.flow-step-icon {
  font-size: 18px;
  line-height: 1.2;
}
.flow-step-card strong {
  font-size: 10.5px;
  color: var(--text-title);
  display: block;
}
.flow-step-card span {
  font-size: 9.5px;
  color: var(--text-muted);
  line-height: 1.3;
}
.flow-step-arrow {
  color: #94a3b8;
  font-size: 16px;
  font-weight: bold;
  user-select: none;
  padding: 0 2px;
}

/* Reading Progress Bar */
.reading-progress-container {
  position: fixed;
  top: 52px;
  left: 0;
  width: 100%;
  height: 3px;
  background: transparent;
  z-index: 10000;
  pointer-events: none;
}
.reading-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #38bdf8, #2563eb, #6366f1);
  transition: width 0.08s ease-out;
}

/* In-Page Search Highlighting & Match Controls */
mark.search-match {
  background: #fde047;
  color: #0f172a;
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 600;
  box-shadow: 0 0 2px rgba(0,0,0,0.2);
}
mark.search-match.current {
  background: #f97316;
  color: #ffffff;
  outline: 2px solid #ea580c;
}
.search-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
}
.search-count {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  min-width: 32px;
  text-align: center;
}
.search-nav-btn {
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease;
}
.search-nav-btn:hover {
  background: #475569;
}
.kbd-hint {
  font-family: monospace;
  font-size: 9px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
}
.sidebar-link.active {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  border-left: 3px solid #2563eb;
  padding-left: 7px;
}
[data-theme="dark"] .sidebar-link.active {
  background: #1e3a8a;
  color: #93c5fd;
  border-left-color: #60a5fa;
}

/* Interactive Web Experience */
@media screen {
  body {
    padding-top: 56px;
    background: var(--bg-body);
  }
  .manual-wrapper {
    max-width: 980px;
    margin: 20px auto 40px auto;
    background: var(--bg-card);
    padding: 32px 40px;
    border-radius: 12px;
    box-shadow: var(--card-shadow);
    border: 1px solid var(--border-subtle);
  }
  .interactive-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 52px;
    background: #0f172a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
  }
  .interactive-header .brand {
    font-weight: 800;
    font-size: 13.5px;
    letter-spacing: 1px;
    color: #38bdf8;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .interactive-header .search-box {
    display: flex;
    align-items: center;
    background: #1e293b;
    border-radius: 6px;
    padding: 4px 10px;
    border: 1px solid #334155;
  }
  .interactive-header .search-box input {
    background: transparent;
    border: none;
    color: #f8fafc;
    font-size: 11.5px;
    outline: none;
    width: 240px;
  }
  .interactive-header .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .interactive-header .nav-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s ease;
  }
  .interactive-header .nav-btn:hover { background: #1d4ed8; }
  .interactive-header .outline-btn { background: #334155; }
  .interactive-header .outline-btn:hover { background: #475569; }
  .interactive-header .theme-btn { background: #1e293b; border: 1px solid #334155; }
  .interactive-header .theme-btn:hover { background: #334155; }
  .interactive-header .switch-btn { background: #334155; color: #e2e8f0; }
  .interactive-header .switch-btn:hover { background: #475569; }

  /* Lightbox Modal */
  .lightbox-modal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 26, 0.92);
    backdrop-filter: blur(6px);
    z-index: 100000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .lightbox-modal.active {
    display: flex;
  }
  .lightbox-container {
    max-width: 95vw;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  .lightbox-container img {
    max-width: 95vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.15);
  }
  .lightbox-caption {
    margin-top: 10px;
    color: #f1f5f9;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }
  .lightbox-close {
    position: absolute;
    top: 16px;
    right: 24px;
    background: rgba(255,255,255,0.15);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .lightbox-close:hover {
    background: rgba(255,255,255,0.3);
  }

  /* Sidebar Drawer */
  .sidebar-drawer {
    position: fixed;
    top: 52px;
    left: 0;
    bottom: 0;
    width: 320px;
    background: var(--bg-card);
    border-right: 1px solid var(--border-color);
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sidebar-drawer.open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    position: fixed;
    top: 52px; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 9997;
    display: none;
  }
  .sidebar-overlay.active {
    display: block;
  }
  .sidebar-header {
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-subtle);
  }
  .sidebar-header h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-title);
  }
  .sidebar-close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 22px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }
  .sidebar-search {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .sidebar-search input {
    width: 100%;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-subtle);
    color: var(--text-main);
    font-size: 11px;
    outline: none;
  }
  .sidebar-nav-list {
    padding: 10px 8px;
    overflow-y: auto;
    flex: 1;
  }
  .sidebar-link {
    display: block;
    padding: 6px 10px;
    border-radius: 6px;
    color: var(--text-main);
    text-decoration: none;
    font-size: 11px;
    line-height: 1.4;
    margin-bottom: 2px;
    transition: background 0.15s, color 0.15s;
  }
  .sidebar-link:hover {
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
  }
  [data-theme="dark"] .sidebar-link:hover {
    background: #1e3a8a;
    color: #93c5fd;
  }

  /* Copy toast */
  .copy-toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #0f172a;
    color: #38bdf8;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    border: 1px solid #38bdf8;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    z-index: 100001;
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s;
  }
  .copy-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  .back-to-top {
    position: fixed;
    bottom: 24px; right: 24px;
    background: #2563eb;
    color: #fff;
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer;
    text-decoration: none;
    font-size: 20px;
    font-weight: 800;
    z-index: 999;
    transition: transform 0.2s, background 0.2s;
  }
  .back-to-top:hover {
    transform: translateY(-3px);
    background: #1d4ed8;
  }
}

@media print {
  :root, [data-theme="dark"] {
    --bg-body: #ffffff !important;
    --bg-card: #ffffff !important;
    --bg-subtle: #f8fafc !important;
    --text-main: #1e293b !important;
    --text-title: #0f172a !important;
    --text-muted: #64748b !important;
    --border-color: #cbd5e1 !important;
    --border-subtle: #e2e8f0 !important;
    --table-stripe: #f8fafc !important;
    --table-border: #e2e8f0 !important;
    --card-shadow: none !important;
    --cover-bg: linear-gradient(145deg, #f8fafc 0%, #f0f4ff 100%) !important;
  }
  .no-print, .interactive-header, .back-to-top, .sidebar-drawer, .sidebar-overlay, .lightbox-modal, .copy-toast, .zoom-hint, .reading-progress-container, .search-controls, .kbd-hint {
    display: none !important;
  }
  body {
    padding-top: 0 !important;
    background: #fff !important;
    color: #1e293b !important;
    font-size: 11px !important;
    line-height: 1.45 !important;
  }
  .manual-wrapper {
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
    margin: 0 !important;
    background: #fff !important;
  }
  .cover {
    height: 96vh !important;
    min-height: 96vh !important;
    max-height: 98vh !important;
    box-sizing: border-box !important;
    page-break-after: always !important;
    break-after: page !important;
    margin-bottom: 0 !important;
    padding: 36px 28px !important;
  }
  .page-break {
    page-break-before: always !important;
    break-before: page !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 0 !important;
  }
  h1, h2, h3, h4, .section-title, .flow-title, .sub-title {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  h2.section-title {
    margin-top: 14px !important;
    margin-bottom: 6px !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .op-unit {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 8px 0 12px 0 !important;
  }
  .screenshot-box {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 6px auto 8px auto !important;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    background: #f8fafc !important;
    text-align: center !important;
  }
  .screenshot-box img {
    max-height: 72mm !important;
    max-width: 100% !important;
    width: auto !important;
    height: auto !important;
    display: block !important;
    margin: 0 auto !important;
    object-fit: contain !important;
  }
  .screenshot-caption {
    font-size: 9px !important;
    padding: 3px 8px !important;
    background: #f1f5f9 !important;
    border-top: 1px solid #cbd5e1 !important;
    color: #475569 !important;
  }
  table.steps-table, table.api-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 6px 0 10px 0 !important;
    font-size: 9.5px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  table.steps-table thead, table.api-table thead {
    display: table-header-group !important;
  }
  table.steps-table tr, table.api-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  table.steps-table td, table.steps-table th, table.api-table td, table.api-table th {
    padding: 4px 7px !important;
  }
  .badge-callout {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
  }
  .diagram-wrapper, .modal-spec, .callout-box, .sitemap-node, .dom-summary {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 6px 0 !important;
  }
  .sitemap-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    page-break-inside: avoid !important;
  }
}
`

function buildHtml(role) {
  const pages = role === 'admin' ? extractedData.adminPages : extractedData.staffPages
  const p = {}
  pages.forEach((page) => {
    p[page.pageName] = page
  })

  // Use relative image links
  const relPath = (file) => `screenshots/${role}/${file}`

  const I =
    role === 'admin'
      ? {
          login: relPath('admin_01_login.png'),
          dash: relPath('admin_02_executive_dashboard.png'),
          dashAcad: relPath('admin_03_dashboard_academic.png'),
          topbar: relPath('admin_04_topbar.png'),
          users: relPath('admin_05_users.png'),
          inviteModal: relPath('admin_06_invite_modal.png'),
          userEdit: relPath('admin_07_user_edit_modal.png'),
          students: relPath('admin_08_students.png'),
          addStudent: relPath('admin_09_add_student.png'),
          invoices: relPath('admin_10_invoices.png'),
          recordPay: relPath('admin_11_record_payment.png'),
          courses: relPath('admin_12_courses.png'),
          materials: relPath('admin_13_materials.png'),
          attendance: relPath('admin_14_attendance.png'),
          assessments: relPath('admin_15_assessments.png'),
          certs: relPath('admin_16_certificates.png'),
          verify: relPath('admin_17_verify_portal.png'),
          reportsFin: relPath('admin_18_reports_financial.png'),
          reportsAcad: relPath('admin_19_reports_academic.png'),
          audit: relPath('admin_20_audit_log.png'),
          gst: relPath('admin_21_gst.png'),
          brand: relPath('admin_22_brand.png'),
          trainers: relPath('admin_23_trainers.png'),
          cats: relPath('admin_24_course_categories.png'),
          skills: relPath('admin_25_skills.png'),
          settings: relPath('admin_26_settings_user.png'),
        }
      : {
          signup: relPath('staff_01_signup.png'),
          login: relPath('staff_02_login.png'),
          topbar: relPath('staff_03_topbar.png'),
          dashA: relPath('staff_04_dashboard.png'),
          dashB: relPath('staff_05_watchlist.png'),
          studentsDir: relPath('staff_06_students.png'),
          addStudent: relPath('staff_07_add_student.png'),
          studentDossier: relPath('staff_08_student_dossier.png'),
          attendancePicker: relPath('staff_09_attendance_picker.png'),
          attendanceMarking: relPath('staff_10_attendance_marking.png'),
          assessmentsStudio: relPath('staff_11_assessments_catalog.png'),
          createAssessment: relPath('staff_12_create_assessment.png'),
          googleFormsImport: relPath('staff_13_google_forms_import.png'),
          classroomQr: relPath('staff_14_classroom_qr.png'),
          gradingStudio: relPath('staff_15_grading_studio.png'),
          materialsDir: relPath('staff_16_materials_dir.png'),
          materialsView: relPath('staff_17_materials_view.png'),
          uploadMaterial: relPath('staff_18_materials_upload.png'),
          reportsAcad: relPath('staff_19_reports_academic.png'),
          reportsAssessments: relPath('staff_20_reports_assessments.png'),
          settingsProfile: relPath('staff_21_settings_profile.png'),
          settingsJson: relPath('staff_22_settings_json.png'),
        }

  // Read pre-built HTML content
  const contentFile = path.resolve(`scripts/manual-content-${role}.html`)
  if (!fs.existsSync(contentFile)) {
    throw new Error(`Content file not found: ${contentFile}`)
  }
  let content = fs.readFileSync(contentFile, 'utf8')

  // Replace image tokens
  Object.entries(I).forEach(([key, val]) => {
    content = content.replaceAll(`{{IMG:${key}}}`, val)
  })

  // Replace extracted DOM tokens
  Object.entries(p).forEach(([pageName, pageData]) => {
    const safeKey = pageName.replace(/[^a-zA-Z0-9]/g, '_')
    const domHtml = domSummary(pageData.dom)
    content = content.replaceAll(`{{DOM:${safeKey}}}`, domHtml)
    const apiHtml = pageData.apiCalls
      .map(
        (c) =>
          `<tr><td><code class="method-${c.method.toLowerCase()}">${c.method}</code></td><td><code>${c.url}</code></td></tr>`,
      )
      .join('')
    content = content.replaceAll(`{{API:${safeKey}}}`, apiHtml)
  })

  // Replace API catalog token
  const apiCatalog = extractedData.apiCatalog
    .map(
      (api) =>
        `<tr><td><code class="method-get">GET/POST</code></td><td><code>${api.route}</code></td><td>${api.tables.join(', ') || 'N/A'}</td><td>${api.permission}</td></tr>`,
    )
    .join('')
  content = content.replaceAll('{{API_CATALOG}}', apiCatalog)

  const otherRole = role === 'admin' ? 'staff' : 'admin'
  const otherRoleLabel = role === 'admin' ? 'Staff Manual' : 'Admin Manual'
  const otherRoleHref = role === 'admin' ? 'Thoorigai_Staff_User_Manual.html' : 'Thoorigai_Admin_User_Manual.html'

  const interactiveHeader = `
  <div class="reading-progress-container no-print">
    <div id="reading-progress-bar" class="reading-progress-bar"></div>
  </div>
  <header class="interactive-header no-print">
    <div class="header-left">
      <button class="nav-btn outline-btn" onclick="toggleSidebar()" title="Toggle Section Outline (Key: O)">&#9776; Outline</button>
      <div class="brand">
        <span>THOORIGAI ACADEMY</span>
        <span class="permission-badge ${role === 'admin' ? 'permission-admin' : 'permission-staff'}">${role.toUpperCase()} MANUAL</span>
      </div>
    </div>
    <div class="search-box">
      <input type="text" id="manual-search" placeholder="Search manual (Press '/' to focus)..." oninput="handleSearchInput(this.value)" onkeydown="handleSearchKey(event)" />
      <div class="search-controls">
        <span id="search-count" class="search-count"></span>
        <button class="search-nav-btn" id="search-prev-btn" onclick="navigateSearch(-1)" title="Previous match (Shift+Enter)">&uarr;</button>
        <button class="search-nav-btn" id="search-next-btn" onclick="navigateSearch(1)" title="Next match (Enter)">&darr;</button>
        <span class="kbd-hint">/</span>
      </div>
    </div>
    <div class="actions">
      <button id="theme-toggle-btn" class="nav-btn theme-btn" onclick="toggleTheme()" title="Switch Theme (Key: D)">&#127769; Theme</button>
      <a href="${otherRoleHref}" class="nav-btn switch-btn">&larr; Switch to ${otherRoleLabel}</a>
      <button onclick="window.print()" class="nav-btn">&#128438; Print / Save PDF</button>
    </div>
  </header>

  <!-- Sidebar Outline Drawer -->
  <aside id="sidebar-drawer" class="sidebar-drawer no-print">
    <div class="sidebar-header">
      <h3>Table of Contents Outline</h3>
      <button class="sidebar-close-btn" onclick="toggleSidebar(false)" title="Close">&times;</button>
    </div>
    <div class="sidebar-search">
      <input type="text" id="sidebar-search-input" placeholder="Quick find section..." oninput="filterSidebar(this.value)" />
    </div>
    <nav id="sidebar-nav-list" class="sidebar-nav-list"></nav>
  </aside>
  <div id="sidebar-overlay" class="sidebar-overlay no-print" onclick="toggleSidebar(false)"></div>

  <!-- Screenshot Zoom Lightbox Modal -->
  <div id="lightbox-modal" class="lightbox-modal no-print" onclick="closeLightbox(event)">
    <button class="lightbox-close" onclick="closeLightbox()" title="Close (Esc)">&times;</button>
    <div class="lightbox-container" onclick="event.stopPropagation()">
      <img id="lightbox-img" src="" alt="Enlarged screenshot" />
      <div id="lightbox-caption" class="lightbox-caption"></div>
    </div>
  </div>

  <!-- Clipboard Toast -->
  <div id="copy-toast" class="copy-toast no-print">Copied to clipboard!</div>

  <a href="#top" class="back-to-top no-print" title="Back to top (Key: T)">&uarr;</a>
  `

  const clientScript = `
  <script>
    // Theme Management
    function initTheme() {
      let saved = 'light';
      try {
        saved = localStorage.getItem('thoorigai_manual_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } catch(e){}
      document.documentElement.setAttribute('data-theme', saved);
      updateThemeBtn(saved);
    }
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('thoorigai_manual_theme', next); } catch(e){}
      updateThemeBtn(next);
    }
    function updateThemeBtn(theme) {
      const btn = document.getElementById('theme-toggle-btn');
      if (btn) btn.innerHTML = theme === 'dark' ? '&#9728; Light' : '&#127769; Dark';
    }

    // Reading Progress Bar
    function updateReadingProgress() {
      const bar = document.getElementById('reading-progress-bar');
      if (!bar) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        bar.style.width = '0%';
        return;
      }
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      bar.style.width = progress + '%';
    }

    // Sidebar Outline Management
    function toggleSidebar(forceState) {
      const drawer = document.getElementById('sidebar-drawer');
      const overlay = document.getElementById('sidebar-overlay');
      const isOpen = drawer.classList.contains('open');
      const next = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (next) {
        drawer.classList.add('open');
        overlay.classList.add('active');
        document.getElementById('sidebar-search-input')?.focus();
      } else {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
      }
    }

    function populateSidebar() {
      const nav = document.getElementById('sidebar-nav-list');
      if (!nav) return;
      nav.innerHTML = '';
      const titles = document.querySelectorAll('h2.section-title');
      titles.forEach((h, idx) => {
        let targetId = h.id;
        if (!targetId) {
          const prev = h.previousElementSibling;
          if (prev && prev.id) {
            targetId = prev.id;
          } else {
            targetId = 'sec-heading-' + idx;
            h.id = targetId;
          }
        }
        const a = document.createElement('a');
        a.href = '#' + targetId;
        a.className = 'sidebar-link';
        a.textContent = h.textContent.replace(/\\s+/g, ' ').trim();
        a.onclick = () => { toggleSidebar(false); };
        nav.appendChild(a);
      });
    }

    function filterSidebar(query) {
      const q = query.trim().toLowerCase();
      const links = document.querySelectorAll('.sidebar-link');
      links.forEach(l => {
        l.style.display = (!q || l.textContent.toLowerCase().includes(q)) ? '' : 'none';
      });
    }

    // Scrollspy with IntersectionObserver
    function initScrollspy() {
      const titles = document.querySelectorAll('h2.section-title');
      const links = document.querySelectorAll('.sidebar-link');
      if (!titles.length || !links.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            links.forEach(l => {
              if (l.getAttribute('href') === '#' + id) {
                l.classList.add('active');
                l.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              } else {
                l.classList.remove('active');
              }
            });
          }
        });
      }, { rootMargin: '-60px 0px -70% 0px' });

      titles.forEach(t => observer.observe(t));
    }

    // In-Page Search Highlighting & Match Cycling
    let searchMatches = [];
    let currentMatchIndex = -1;

    function clearSearchHighlighting() {
      const marks = document.querySelectorAll('mark.search-match');
      marks.forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
      searchMatches = [];
      currentMatchIndex = -1;
      const countEl = document.getElementById('search-count');
      if (countEl) countEl.textContent = '';
    }

    function highlightMatches(query) {
      clearSearchHighlighting();
      const q = query.trim();
      if (!q || q.length < 2) return;

      const main = document.querySelector('.manual-wrapper');
      if (!main) return;

      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'MARK' || parent.classList.contains('no-print'))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.textContent.toLowerCase().includes(q.toLowerCase())) {
          textNodes.push(n);
        }
      }

      textNodes.forEach(node => {
        const text = node.textContent;
        const lower = text.toLowerCase();
        const qLower = q.toLowerCase();
        let index = lower.indexOf(qLower);
        if (index === -1) return;

        const fragment = document.createDocumentFragment();
        let lastIdx = 0;
        while (index !== -1) {
          if (index > lastIdx) {
            fragment.appendChild(document.createTextNode(text.substring(lastIdx, index)));
          }
          const mark = document.createElement('mark');
          mark.className = 'search-match';
          mark.textContent = text.substr(index, q.length);
          fragment.appendChild(mark);
          searchMatches.push(mark);
          lastIdx = index + q.length;
          index = lower.indexOf(qLower, lastIdx);
        }
        if (lastIdx < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
        }
        node.parentNode.replaceChild(fragment, node);
      });

      const countEl = document.getElementById('search-count');
      if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        updateCurrentMatch();
      } else if (countEl) {
        countEl.textContent = '0 found';
      }
    }

    function updateCurrentMatch() {
      searchMatches.forEach((m, idx) => {
        if (idx === currentMatchIndex) {
          m.classList.add('current');
          m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          m.classList.remove('current');
        }
      });
      const countEl = document.getElementById('search-count');
      if (countEl) {
        countEl.textContent = (currentMatchIndex + 1) + '/' + searchMatches.length;
      }
    }

    function navigateSearch(delta) {
      if (!searchMatches.length) return;
      currentMatchIndex = (currentMatchIndex + delta + searchMatches.length) % searchMatches.length;
      updateCurrentMatch();
    }

    function filterManual(query) {
      const q = query.trim().toLowerCase();
      const sections = document.querySelectorAll('.toc-section');
      sections.forEach(s => {
        if (!q) { s.style.display = ''; return; }
        s.style.display = s.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }

    function handleSearchInput(val) {
      filterManual(val);
      highlightMatches(val);
    }

    function handleSearchKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateSearch(e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') {
        const input = document.getElementById('manual-search');
        if (input) {
          input.value = '';
          handleSearchInput('');
          input.blur();
        }
      }
    }

    // Lightbox Modal Management
    function openLightbox(src, caption) {
      const modal = document.getElementById('lightbox-modal');
      const img = document.getElementById('lightbox-img');
      const cap = document.getElementById('lightbox-caption');
      if (!modal || !img) return;
      img.src = src;
      cap.textContent = caption || '';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(e) {
      if (e && e.target && e.target.closest && e.target.closest('.lightbox-container') && !e.target.classList.contains('lightbox-close')) return;
      const modal = document.getElementById('lightbox-modal');
      if (!modal) return;
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Clipboard and Toast Feedback
    function showToast(msg) {
      const t = document.getElementById('copy-toast');
      if (!t) return;
      t.textContent = msg || 'Copied to clipboard!';
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    }
    function copyText(txt) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => showToast('Copied: "' + (txt.length > 30 ? txt.slice(0,30) + '...' : txt) + '"'));
      } else {
        const el = document.createElement('textarea');
        el.value = txt;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('Copied: "' + (txt.length > 30 ? txt.slice(0,30) + '...' : txt) + '"');
      }
    }

    // Initialize all interactive behaviors on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      populateSidebar();
      initScrollspy();
      updateReadingProgress();

      window.addEventListener('scroll', updateReadingProgress, { passive: true });

      // Enable Lightbox on all screenshot boxes
      const boxes = document.querySelectorAll('.screenshot-box');
      boxes.forEach(box => {
        const img = box.querySelector('img');
        const cap = box.querySelector('.screenshot-caption');
        if (img) {
          box.onclick = (e) => {
            if (e.target.tagName !== 'A') openLightbox(img.src, cap ? cap.innerText.replace('Click to zoom', '').trim() : '');
          };
          if (cap && !cap.querySelector('.zoom-hint')) {
            const hint = document.createElement('span');
            hint.className = 'zoom-hint no-print';
            hint.innerHTML = '&#128269; Click to zoom';
            cap.appendChild(hint);
          }
        }
      });

      // Enable quick-copy on route pills
      const pills = document.querySelectorAll('.route-pill');
      pills.forEach(p => {
        p.title = 'Click to copy route';
        p.onclick = (e) => {
          e.stopPropagation();
          copyText(p.textContent.trim());
        };
      });

      // Enable quick-copy on API codes
      const apiCodes = document.querySelectorAll('table.api-table td:nth-child(2) code');
      apiCodes.forEach(c => {
        c.style.cursor = 'pointer';
        c.title = 'Click to copy endpoint';
        c.onclick = (e) => {
          e.stopPropagation();
          copyText(c.textContent.trim());
        };
      });

      // Global Keydown Listeners
      document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInput = activeTag === 'input' || activeTag === 'textarea';

        if (e.key === 'Escape') {
          closeLightbox();
          toggleSidebar(false);
          const sInput = document.getElementById('manual-search');
          if (sInput && sInput.value) {
            sInput.value = '';
            handleSearchInput('');
            sInput.blur();
          }
          return;
        }

        if (!isInput) {
          if (e.key === '/') {
            e.preventDefault();
            const sInput = document.getElementById('manual-search');
            sInput?.focus();
            sInput?.select();
          } else if (e.key === 'd' || e.key === 'D') {
            toggleTheme();
          } else if (e.key === 'o' || e.key === 'O') {
            toggleSidebar();
          } else if (e.key === 't' || e.key === 'T') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    });
  </script>
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${role === 'admin' ? 'Administrator' : 'Staff'} Operations Manual - ThoorigAI Infotech</title>
  <style>${CSS}</style>
</head>
<body id="top">
  ${interactiveHeader}
  <main class="manual-wrapper">
    ${content}
  </main>
  ${clientScript}
</body>
</html>`
}

const adminTitles = [
  ['s00', 'System Architecture & Complete Sitemap'],
  ['s01', 'System Authentication & Login'],
  ['s02', 'Top Navigation Bar & Notifications'],
  ['s03', 'Executive Dashboard'],
  ['s04', 'Users & Roles Management'],
  ['s05', 'Students Directory'],
  ['s06', 'Invoices & Billing Ledger'],
  ['s07', 'Courses & Curriculum Management'],
  ['s08', 'Course Materials Repository'],
  ['s09', 'Daily Attendance Tracker'],
  ['s10', 'Assessments Studio'],
  ['s11', 'Certificates Registry & Issuance'],
  ['s12', 'Reports & Business Analytics'],
  ['s13', 'Audit Log Forensics'],
  ['s14', 'GST Compliance Settings'],
  ['s15', 'Brand Information Settings'],
  ['s16', 'Instructor Assignments'],
  ['s17', 'Course Categories'],
  ['s18', 'Skill Tags Management'],
  ['s19', 'Personal Account Settings'],
  ['s20', 'Public Certificate Verification Portal'],
  ['s21', 'Complete API Endpoint Reference'],
  ['s22', 'Role & Permissions Authority Matrix'],
  ['s23', 'Keyboard Shortcuts & Accessibility Guide'],
  ['s24', 'Disaster Recovery & Offline Data Export SOP'],
  ['s25', 'System Requirements & Browser Compatibility'],
  ['s26', 'Institutional Terminology & Glossary'],
  ['s27', 'Operational Troubleshooting & FAQ Matrix'],
]

const staffTitles = [
  ['ss00', 'System Architecture & Complete Staff Portal Sitemap'],
  ['ss01', 'Onboarding: Receiving & Validating Single-Use OTP Invite Codes'],
  ['ss02', 'Account Registration & Password Configuration'],
  ['ss03', 'Daily Authentication & Multi-Tab Session Security'],
  ['ss04', 'Global Shell Controls: Topbar, Search & Notifications'],
  ['ss05', 'Staff Classroom Dashboard Overview & Quick Actions Dock'],
  ['ss06', 'Classroom Attendance Health, Watchlist & Faculty SOP Checklist'],
  ['ss07', 'Student Roster Management & Directory Filtering'],
  ['ss08', 'Student Enrollment & New Admission Modal'],
  ['ss09', 'Comprehensive Student Dossier & Academic History'],
  ['ss10', 'Daily Attendance Session Picker & Date Controls'],
  ['ss11', 'Live Daily Attendance Marking Sheet'],
  ['ss12', 'Assessments Studio Catalog & Evaluation Overview'],
  ['ss13', 'Creating a New Course Assessment & Google Quiz Setup'],
  ['ss14', 'Google Forms & Sheets Response Import Synchronization'],
  ['ss15', 'Instant Classroom Live QR Code Projection Modal'],
  ['ss16', 'Inline Evaluation & Grading Studio Workflow'],
  ['ss17', 'Course Materials Repository Directory'],
  ['ss18', 'Managing Program Materials & Presigned Cloud Downloads'],
  ['ss19', 'Uploading Lesson Materials Modal'],
  ['ss20', 'Academic Reports: Attendance Trends & Date Filters'],
  ['ss21', 'Academic Reports: Examination Analytics & Score Rosters'],
  ['ss22', 'Instructor Account & Personal Profile Settings'],
  ['ss23', 'Custom Profile Metadata & Structured JSON Inspector'],
  ['ss24', 'Complete Staff REST API & Permissions Endpoint Matrix'],
  ['ss25', 'Role Authority Matrix & Faculty Security Boundaries'],
  ['ss26', 'Faculty Keyboard Shortcuts & Rapid Roll-Call Navigation'],
  ['ss27', 'Classroom Hardware, Tablet & Network Matrix'],
  ['ss28', 'Institutional Terminology & Academic Glossary'],
  ['ss29', 'Faculty Classroom Emergency Playbook & Quick-Fix Matrix'],
]

export async function getExactSectionPages(pdfPath, titles, skipTocPages = 4) {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise

  const pageMap = {}
  for (let pageNum = skipTocPages; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')

    titles.forEach(([id, label], idx) => {
      if (!pageMap[id]) {
        const numStr = String(idx).padStart(2, '0')
        const cleanLabel = label
          .replace(/&amp;/g, '&')
          .replace(/&mdash;/g, '—')
          .replace(/\(.*?\)/g, '')
          .trim()
        const firstWord = cleanLabel.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '')

        const pattern = new RegExp(`\\b${numStr}\\s+${firstWord}`, 'i')
        if (pattern.test(text)) {
          pageMap[id] = pageNum
        }
      }
    })
  }

  return pageMap
}

function updateHtmlTocPages(htmlPath, pageMap) {
  let html = fs.readFileSync(htmlPath, 'utf8')
  let changed = false

  Object.entries(pageMap).forEach(([id, pageNum]) => {
    const targetPattern = new RegExp(`(<span class="toc-page" id="toc-pg-${id}">Page )(\\d+)(</span>)`)
    if (targetPattern.test(html)) {
      const formattedPage = String(pageNum).padStart(2, '0')
      html = html.replace(targetPattern, `$1${formattedPage}$3`)
      changed = true
    }
  })

  if (changed) {
    fs.writeFileSync(htmlPath, html, 'utf8')
  }
  return changed
}

async function renderPdf(page, htmlPath, pdfPath, role) {
  const url = 'file:///' + htmlPath.replace(/\\/g, '/')
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const headerTitle = role === 'admin' ? 'Administrator Operations Manual' : 'Staff Operations Manual'
  const pdfBytes = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm',
    },
    headerTemplate: `<div style="width:100%;font-family:sans-serif;font-size:8.5px;color:#94a3b8;display:flex;justify-content:space-between;padding:0 12mm;"><span>ThoorigAI Infotech LLP &bull; ${headerTitle}</span><span>CONFIDENTIAL</span></div>`,
    footerTemplate: `<div style="width:100%;font-family:sans-serif;font-size:8.5px;color:#94a3b8;display:flex;justify-content:space-between;padding:0 12mm;"><span>ThoorigAI Infotech LLP &bull; Operations Manual &bull; Confidential</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  })
  fs.writeFileSync(pdfPath, pdfBytes)
  return pdfBytes
}

async function main() {
  const adminHtmlPath = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.html')
  const adminPdfPath = path.join(MANUALS_DIR, 'Thoorigai_Admin_User_Manual.pdf')
  const staffHtmlPath = path.join(MANUALS_DIR, 'Thoorigai_Staff_User_Manual.html')
  const staffPdfPath = path.join(MANUALS_DIR, 'Thoorigai_Staff_User_Manual.pdf')

  // Generate initial HTML files
  let adminHtml = buildHtml('admin')
  fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8')
  console.log('Initial Admin HTML generated:', (adminHtml.length / 1024).toFixed(0), 'KB')

  let staffHtml = buildHtml('staff')
  fs.writeFileSync(staffHtmlPath, staffHtml, 'utf8')
  console.log('Initial Staff HTML generated:', (staffHtml.length / 1024).toFixed(0), 'KB')

  console.log('Launching browser for PDF export & TOC pagination calibration...')
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const context = await browser.newContext()
  const page = await context.newPage()

  // --- PASS 1: ADMIN PDF & EXACT PAGE CALIBRATION ---
  console.log('Admin Pass 1: Rendering PDF for exact pagination measurement...')
  await renderPdf(page, adminHtmlPath, adminPdfPath, 'admin')
  const adminExactPages = await getExactSectionPages(adminPdfPath, adminTitles, 4)
  console.log('Admin exact measured section pages:', adminExactPages)
  updateHtmlTocPages(adminHtmlPath, adminExactPages)

  // Admin Pass 2: Final PDF with exact calibrated TOC
  console.log('Admin Pass 2: Re-rendering final PDF with 100% synchronized TOC...')
  const finalAdminPdf = await renderPdf(page, adminHtmlPath, adminPdfPath, 'admin')
  console.log('Admin Final PDF generated:', (finalAdminPdf.length / 1024).toFixed(0), 'KB')

  // --- PASS 1: STAFF PDF & EXACT PAGE CALIBRATION ---
  console.log('Staff Pass 1: Rendering PDF for exact pagination measurement...')
  await renderPdf(page, staffHtmlPath, staffPdfPath, 'staff')
  const staffExactPages = await getExactSectionPages(staffPdfPath, staffTitles, 4)
  console.log('Staff exact measured section pages:', staffExactPages)
  updateHtmlTocPages(staffHtmlPath, staffExactPages)

  // Staff Pass 2: Final PDF with exact calibrated TOC
  console.log('Staff Pass 2: Re-rendering final PDF with 100% synchronized TOC...')
  const finalStaffPdf = await renderPdf(page, staffHtmlPath, staffPdfPath, 'staff')
  console.log('Staff Final PDF generated:', (finalStaffPdf.length / 1024).toFixed(0), 'KB')

  await browser.close()

  // Copy final deliverables to /out directory
  const outDir = path.resolve('out')
  fs.mkdirSync(outDir, { recursive: true })
  fs.copyFileSync(adminPdfPath, path.join(outDir, 'admin_manual.pdf'))
  fs.copyFileSync(staffPdfPath, path.join(outDir, 'staff_manual.pdf'))
  console.log('Copied final PDFs to out/admin_manual.pdf and out/staff_manual.pdf')
  console.log('All manual builds and 2-pass TOC calibrations completed successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

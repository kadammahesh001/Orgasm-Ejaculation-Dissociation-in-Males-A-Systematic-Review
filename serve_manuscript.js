const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\Mahesh Kadam\\OneDrive\\Desktop\\Research Paper';

const parts = [
  'Transformed_Manuscript_Part1.md',
  'Transformed_Manuscript_Part2.md',
  'Transformed_Manuscript_Part3.md'
];

// Read all parts
let md = '';
for (const p of parts) {
  const fp = path.join(BASE, p);
  if (fs.existsSync(fp)) {
    md += fs.readFileSync(fp, 'utf8') + '\n\n';
  }
}

// Simple markdown to HTML converter (headings, bold, italic, tables, hr, lists, paragraphs)
function mdToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let tableHtml = '';
  let inList = false;
  let listType = '';
  let tableHeaderDone = false;

  function closeList() {
    if (inList) { html += `</${listType}>\n`; inList = false; listType = ''; }
  }
  function closeTable() {
    if (inTable) { html += tableHtml + '</tbody></table>\n'; inTable = false; tableHtml = ''; tableHeaderDone = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table detection
    if (line.trim().startsWith('|')) {
      if (!inTable) { closeList(); inTable = true; tableHtml = '<table><thead><tr>'; tableHeaderDone = false; }
      const cells = line.trim().replace(/^\||\|$/g,'').split('|');
      if (cells.every(c => /^[-:\s]+$/.test(c))) {
        tableHtml += '</tr></thead><tbody>';
        tableHeaderDone = true;
      } else {
        const tag = tableHeaderDone ? 'td' : 'th';
        const rowTag = tableHeaderDone ? 'tr' : '';
        if (tableHeaderDone) tableHtml += '<tr>';
        for (const c of cells) {
          tableHtml += `<${tag}>${inline(c.trim())}</${tag}>`;
        }
        if (tableHeaderDone) tableHtml += '</tr>';
      }
      continue;
    } else { closeTable(); }

    // HR
    if (/^---+$/.test(line.trim())) { closeList(); html += '<hr>\n'; continue; }

    // Headings
    const hm = line.match(/^(#{1,4})\s+(.*)/);
    if (hm) { closeList(); html += `<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>\n`; continue; }

    // Unordered list
    const ulm = line.match(/^[\s]*[-*]\s+(.*)/);
    if (ulm) {
      if (!inList || listType !== 'ul') { closeList(); html += '<ul>\n'; inList = true; listType = 'ul'; }
      html += `<li>${inline(ulm[1])}</li>\n`; continue;
    }

    // Ordered list
    const olm = line.match(/^\d+\.\s+(.*)/);
    if (olm) {
      if (!inList || listType !== 'ol') { closeList(); html += '<ol>\n'; inList = true; listType = 'ol'; }
      html += `<li>${inline(olm[1])}</li>\n`; continue;
    }

    closeList();

    // Blank line
    if (line.trim() === '') { html += '\n'; continue; }

    // Paragraph
    html += `<p>${inline(line)}</p>\n`;
  }
  closeList(); closeTable();
  return html;
}

function inline(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

const bodyHtml = mdToHtml(md);

const css = `
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Source+Sans+3:wght@300;400;600;700&display=swap');
@page{size:A4;margin:25mm 22mm 25mm 25mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Merriweather',Georgia,serif;font-size:10.5pt;line-height:1.8;color:#1a1a1a;text-align:justify}
h1{font-family:'Source Sans 3',sans-serif;font-size:16pt;font-weight:700;color:#0d2340;line-height:1.3;margin:0 0 18pt;padding-bottom:10pt;border-bottom:2.5pt solid #1a5276;page-break-after:avoid}
h2{font-family:'Source Sans 3',sans-serif;font-size:13pt;font-weight:700;color:#1a5276;margin:22pt 0 8pt;padding-bottom:4pt;border-bottom:1pt solid #aed6f1;page-break-after:avoid}
h3{font-family:'Source Sans 3',sans-serif;font-size:11pt;font-weight:600;color:#21618c;margin:16pt 0 6pt;page-break-after:avoid}
h4{font-family:'Source Sans 3',sans-serif;font-size:10pt;font-weight:600;color:#2e86c1;margin:12pt 0 4pt;font-style:italic;page-break-after:avoid}
p{margin:0 0 9pt;orphans:3;widows:3}
strong{color:#0d2340}
hr{border:none;border-top:1pt solid #d5e8f3;margin:18pt 0}
table{width:100%;border-collapse:collapse;margin:14pt 0 6pt;font-family:'Source Sans 3',sans-serif;font-size:9pt;page-break-inside:avoid}
thead tr{background:#1a5276;color:white}
thead th{padding:7pt 9pt;text-align:left;font-weight:600}
tbody tr:nth-child(even){background:#eaf3fb}
tbody tr:nth-child(odd){background:#f9fcfe}
tbody td{padding:6pt 9pt;border-bottom:0.5pt solid #d5e8f3;vertical-align:top;line-height:1.5}
ul,ol{margin:6pt 0 10pt 20pt}
li{margin-bottom:4pt;line-height:1.6}
code{font-family:monospace;font-size:8.5pt;background:#f4f4f4;padding:1pt 3pt;border-radius:2pt}
blockquote{border-left:4pt solid #f39c12;background:#fef9f0;padding:10pt 14pt;margin:12pt 0;font-size:9.5pt}
.cover{text-align:center;padding:60pt 0 40pt;border-bottom:2pt solid #1a5276;margin-bottom:30pt;page-break-after:always}
.cover h1{border:none;font-size:18pt;margin:0 0 20pt}
.meta{font-family:'Source Sans 3',sans-serif;font-size:9.5pt;color:#555;margin:6pt 0}
.abstract-box{background:#f4f8fb;border-left:4pt solid #1a5276;padding:14pt 18pt;margin:16pt 0}
@media print{
  .no-print{display:none}
  a{color:inherit;text-decoration:none}
}
`;

const printBtn = `
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:9999">
  <button onclick="window.print()" style="background:#1a5276;color:white;border:none;padding:12px 24px;font-size:14px;border-radius:6px;cursor:pointer;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    🖨️ Save as PDF (Ctrl+P)
  </button>
</div>
<div class="no-print" style="position:fixed;top:60px;right:16px;z-index:9999;background:#fff3cd;border:1px solid #ffc107;padding:8px 12px;border-radius:4px;font-family:sans-serif;font-size:12px;max-width:220px">
  In Print dialog:<br>• Destination → <strong>Save as PDF</strong><br>• Paper: <strong>A4</strong><br>• ✅ Background graphics
</div>`;

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Orgasm–Ejaculation Dissociation — Manuscript</title>
<style>${css}</style>
</head>
<body>
${printBtn}
<div class="cover">
  <p class="meta" style="font-size:9pt;color:#888;margin-bottom:20pt">SYSTEMATIC REVIEW &amp; EVIDENCE SYNTHESIS</p>
  <h1>Physiological and Neurobiological Dissociation of<br>Male Orgasm and Ejaculation:<br>Mechanisms, Clinical Evidence, and Behavioral Interventions</h1>
  <p class="meta"><em>Target Journal:</em> The Journal of Sexual Medicine / Nature Reviews Urology</p>
  <p class="meta"><em>Running Head:</em> Orgasm–Ejaculation Dissociation in Males</p>
  <p class="meta" style="margin-top:20pt;font-size:8.5pt;color:#999">Prepared 2026 · Evidence graded per Oxford CEBM / GRADE framework</p>
</div>
${bodyHtml}
</body>
</html>`;

// Save HTML file
const htmlOut = path.join(BASE, 'Publication_Ready_Manuscript_FINAL.html');
fs.writeFileSync(htmlOut, fullHtml, 'utf8');
console.log('HTML written:', htmlOut);

// Serve it
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
  res.end(fullHtml);
});
server.listen(7788, '127.0.0.1', () => {
  console.log('Server running: http://127.0.0.1:7788');
  console.log('Open this URL in Chrome, then press Ctrl+P → Save as PDF → A4 → Save');
});

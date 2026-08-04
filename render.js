/* render.js — Fetches the manuscript markdown and renders it as premium HTML */

(function () {
  const MANUSCRIPT_URL = 'Publication_Ready_Manuscript.md';
  const container = document.getElementById('manuscript-content');

  fetch(MANUSCRIPT_URL)
    .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.text(); })
    .then(md => {
      container.innerHTML = renderManuscript(md);
      postRender();
    })
    .catch(() => {
      container.innerHTML = renderManuscript(FALLBACK_CONTENT);
      postRender();
    });

  function postRender() {
    // Update word count
    const text = container.innerText || '';
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 238));
    document.querySelectorAll('#word-count, #word-count-2').forEach(e => e.textContent = words.toLocaleString());
    document.querySelectorAll('#reading-time, #reading-time-2').forEach(e => e.textContent = mins + ' min');

    // Re-init TOC and other features after content is loaded
    if (typeof initTOC === 'function') initTOC();
    if (typeof initLightbox === 'function') initLightbox();
    if (typeof initCollapsible === 'function') initCollapsible();
    if (typeof initLazyLoad === 'function') initLazyLoad();

    // Add IDs to headings for deep linking
    container.querySelectorAll('h2, h3, h4').forEach((h, i) => {
      if (!h.id) h.id = 'sec-' + i;
    });

    // Re-init TOC after adding IDs
    const tocList = document.getElementById('toc-list');
    if (tocList) {
      tocList.innerHTML = '';
      if (typeof initTOC === 'function') initTOC();
    }
  }

  function renderManuscript(md) {
    const lines = md.split('\n');
    let html = '';
    let inTable = false;
    let inCodeBlock = false;
    let inList = false;
    let listType = '';
    let tableRows = [];
    let sectionOpen = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code blocks (ASCII diagrams)
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          html += '</pre></div>';
        } else {
          inCodeBlock = true;
          html += '<div class="diagram-block"><pre>';
        }
        continue;
      }
      if (inCodeBlock) {
        html += escapeHtml(line) + '\n';
        continue;
      }

      // Skip front matter lines
      if (line.startsWith('**Journal Target') || line.startsWith('**Document Type') || line.startsWith('**Publication Status')) continue;

      // Horizontal rules / separators
      if (/^---+\s*$/.test(line.trim())) {
        if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
        continue;
      }

      // Headings
      if (line.startsWith('# ') && !line.startsWith('# P')) {
        // Skip the main title (already in hero)
        continue;
      }

      if (line.startsWith('## ')) {
        if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
        if (sectionOpen) html += '</div>';
        sectionOpen = true;
        const text = processInline(line.replace(/^## /, ''));
        const icon = getSectionIcon(text);
        html += `<div class="section"><h2>${icon} ${text}</h2>`;
        continue;
      }

      if (line.startsWith('### ')) {
        if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
        const text = processInline(line.replace(/^### /, ''));
        html += `<h3>${text}</h3>`;
        continue;
      }

      if (line.startsWith('#### ')) {
        if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
        const text = processInline(line.replace(/^#### /, ''));
        html += `<h4>${text}</h4>`;
        continue;
      }

      // Callout blocks (> [!TYPE])
      if (line.trim().startsWith('> [!')) {
        const typeMatch = line.match(/>\s*\[!(\w[\w\s]*)\]/);
        const type = typeMatch ? typeMatch[1].toUpperCase().trim() : 'NOTE';
        const calloutClass = getCalloutClass(type);
        const calloutTitle = getCalloutTitle(type);
        let content = '';
        i++;
        while (i < lines.length && lines[i].startsWith('>')) {
          let cLine = lines[i].replace(/^>\s?/, '');
          if (cLine.startsWith('**') && cLine.endsWith('**')) {
            // This is the title line inside the callout
            const titleText = cLine.replace(/\*\*/g, '');
            content += `<div style="font-weight:700;margin-bottom:0.5rem;font-size:0.95rem">${titleText}</div>`;
          } else {
            content += processInline(cLine) + ' ';
          }
          i++;
        }
        i--; // Back up one line
        html += `<div class="callout ${calloutClass}"><div class="callout-title">${calloutTitle}</div><div class="callout-content">${content.trim()}</div></div>`;
        continue;
      }

      // Blockquotes (non-callout)
      if (line.trim().startsWith('> ') && !line.includes('[!')) {
        let content = '';
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          content += processInline(lines[i].replace(/^>\s?/, '')) + ' ';
          i++;
        }
        i--;
        html += `<div class="callout callout-note"><div class="callout-content">${content.trim()}</div></div>`;
        continue;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        // Skip separator rows
        if (/^\|[\s:-]+\|/.test(line.trim())) continue;
        const cells = line.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
        tableRows.push(cells);
        // Check if next line is end of table
        if (i + 1 >= lines.length || (!lines[i + 1].trim().startsWith('|') && !/^\|[\s:-]+\|/.test(lines[i + 1].trim()))) {
          html += renderTable(tableRows);
          inTable = false;
          tableRows = [];
        }
        continue;
      }

      // Unordered lists
      if (/^\s*[-*]\s/.test(line)) {
        if (!inList || listType !== 'ul') {
          if (inList) html += '</ol>';
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        const content = processInline(line.replace(/^\s*[-*]\s+/, ''));
        html += `<li>${content}</li>`;
        continue;
      }

      // Ordered lists
      if (/^\s*\d+\.\s/.test(line)) {
        if (!inList || listType !== 'ol') {
          if (inList) html += '</ul>';
          html += '<ol>';
          inList = true;
          listType = 'ol';
        }
        const content = processInline(line.replace(/^\s*\d+\.\s+/, ''));
        html += `<li>${content}</li>`;
        continue;
      }

      // Close list if we hit a non-list line
      if (inList && line.trim() === '') {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
        continue;
      }

      // Regular paragraphs
      if (line.trim().length > 0) {
        html += `<p>${processInline(line)}</p>`;
      }
    }

    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
    if (sectionOpen) html += '</div>';

    return html;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function processInline(text) {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`(.+?)`/g, '<code style="background:var(--gray-100);padding:2px 6px;border-radius:4px;font-size:0.88em">$1</code>');
    // Evidence level badges
    text = text.replace(/\(Level (I{1,3}V?|IV|V|VI|VII)\)/g, (m, lvl) => {
      return `<span class="evidence-badge ev-${lvl}">Level ${lvl}</span>`;
    });
    text = text.replace(/Level (I{1,3}V?|IV|V|VI|VII)\b/g, (m, lvl) => {
      if (m.includes('evidence-badge')) return m;
      return `<span class="evidence-badge ev-${lvl}">Level ${lvl}</span>`;
    });
    // LaTeX-style math (simple)
    text = text.replace(/\$(.+?)\$/g, '<em style="font-family:serif">$1</em>');
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--teal)">$1</a>');
    return text;
  }

  function renderTable(rows) {
    if (rows.length === 0) return '';
    let html = '<div class="table-wrapper"><table>';
    // First row as header
    html += '<thead><tr>';
    rows[0].forEach(c => { html += `<th>${processInline(c)}</th>`; });
    html += '</tr></thead><tbody>';
    for (let r = 1; r < rows.length; r++) {
      html += '<tr>';
      rows[r].forEach(c => { html += `<td>${processInline(c)}</td>`; });
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function getSectionIcon(text) {
    const t = text.toLowerCase();
    if (t.includes('abstract') || t.includes('front matter')) return '📋';
    if (t.includes('introduction') || t.includes('research question')) return '🔬';
    if (t.includes('anatomy') || t.includes('physiology')) return '🧬';
    if (t.includes('neurobiology') || t.includes('spinal')) return '🧠';
    if (t.includes('dissociation') || t.includes('orgasm')) return '⚡';
    if (t.includes('behavioral') || t.includes('technique')) return '🎯';
    if (t.includes('taoist') || t.includes('tantric') || t.includes('traditional')) return '🌿';
    if (t.includes('semen') || t.includes('retention')) return '🔬';
    if (t.includes('psychological')) return '💭';
    if (t.includes('methodological') || t.includes('research gap')) return '📊';
    if (t.includes('discussion') || t.includes('conclusion') || t.includes('clinical')) return '🏥';
    if (t.includes('executive') || t.includes('highlight')) return '⭐';
    if (t.includes('abbreviation')) return '📝';
    return '📖';
  }

  function getCalloutClass(type) {
    const t = type.toLowerCase();
    if (t.includes('clinical') || t.includes('pearl') || t.includes('tip')) return 'callout-pearl';
    if (t.includes('finding') || t.includes('important')) return 'callout-finding';
    if (t.includes('gap') || t.includes('warning')) return 'callout-gap';
    if (t.includes('note') || t.includes('science')) return 'callout-note';
    if (t.includes('caution') || t.includes('danger')) return 'callout-caution';
    if (t.includes('summary') || t.includes('evidence')) return 'callout-summary';
    return 'callout-note';
  }

  function getCalloutTitle(type) {
    const t = type.toLowerCase();
    if (t.includes('clinical') || t.includes('pearl')) return '💎 Clinical Pearl';
    if (t.includes('tip')) return '💡 Clinical Recommendation';
    if (t.includes('finding') || t.includes('important')) return '🔑 Key Finding';
    if (t.includes('gap')) return '⚠️ Research Gap';
    if (t.includes('warning')) return '⚠️ Warning';
    if (t.includes('note')) return '📝 Note';
    if (t.includes('science')) return '🔬 Scientific Evidence';
    if (t.includes('caution') || t.includes('danger')) return '🚨 Caution';
    if (t.includes('summary') || t.includes('evidence')) return '📊 Evidence Summary';
    return '📌 ' + type;
  }

  // Minimal fallback content if fetch fails
  const FALLBACK_CONTENT = `## Content Loading Error
Please ensure the file **Publication_Ready_Manuscript.md** is in the same directory as this HTML file and that you are serving the site via a local web server (not opening the HTML file directly).

### How to view this website:
1. Open a terminal in the Research Paper directory
2. Run: \`npx serve .\` or \`python -m http.server 8000\`
3. Open the URL shown in your browser`;
})();

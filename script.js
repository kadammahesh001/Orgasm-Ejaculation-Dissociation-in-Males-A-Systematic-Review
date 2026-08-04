/* ============================================================
   Research Paper Website — script.js
   ============================================================ */

/* ---------- Reading Progress Bar ---------- */
function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / total * 100).toFixed(1) + '%';
  }, { passive: true });
}

/* ---------- Estimated Reading Time ---------- */
function initReadingTime() {
  const el = document.getElementById('reading-time');
  if (!el) return;
  const text = document.getElementById('content-area')?.innerText || '';
  const words = text.trim().split(/\s+/).length;
  el.textContent = Math.max(1, Math.round(words / 238)) + ' min read';
}

/* ---------- Back to Top ---------- */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Dark Mode ---------- */
function initDarkMode() {
  const btn = document.getElementById('dark-toggle');
  if (!btn) return;
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  btn.textContent = saved === 'dark' ? '☀️ Light' : '🌙 Dark';
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
  });
}

/* ---------- Table of Contents ---------- */
function initTOC() {
  const list = document.getElementById('toc-list');
  if (!list) return;
  const headings = document.querySelectorAll('#content-area h2, #content-area h3');
  headings.forEach((h, i) => {
    if (!h.id) h.id = 'heading-' + i;
    const li = document.createElement('li');
    li.className = h.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent.replace(/[🔬📖🧠💊🌿🔭⚗️]/g, '').trim();
    a.addEventListener('click', e => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(a);
    list.appendChild(li);
  });

  // Active highlighting
  const observer = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const link = list.querySelector(`a[href="#${en.target.id}"]`);
      if (link) link.classList.toggle('active', en.isIntersecting);
    });
  }, { rootMargin: '-15% 0% -70% 0%' });
  headings.forEach(h => observer.observe(h));
}

/* ---------- Full-text Search ---------- */
function initSearch() {
  const input = document.getElementById('search-bar');
  if (!input) return;
  const content = document.getElementById('content-area');
  let originalHTML = content.innerHTML;
  let timeout;

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.trim();
      content.innerHTML = originalHTML;
      if (q.length < 2) return;
      try {
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightInNode(content, regex);
        const first = content.querySelector('.search-highlight');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
    }, 250);
  });
}

function highlightInNode(node, regex) {
  if (node.nodeType === 3) {
    const parts = node.textContent.split(regex);
    if (parts.length <= 1) return;
    const frag = document.createDocumentFragment();
    parts.forEach((p, i) => {
      if (i % 2 === 1) {
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = p;
        frag.appendChild(mark);
      } else {
        frag.appendChild(document.createTextNode(p));
      }
    });
    node.parentNode.replaceChild(frag, node);
  } else if (node.nodeType === 1 && !['SCRIPT','STYLE','MARK'].includes(node.tagName)) {
    [...node.childNodes].forEach(c => highlightInNode(c, regex));
  }
}

/* ---------- Citation Generator ---------- */
const PAPER = {
  author: 'Kadam M',
  authorFull: 'Kadam, Mahesh',
  year: '2026',
  title: 'Physiological and Neurobiological Dissociation of Male Orgasm and Ejaculation: A Comprehensive Scientific Review of Behavioral Interventions, Semen Retention, and Clinical Implications',
  journal: 'Preprint',
  doi: '10.XXXXX/preprint.2026',
};

const CITATIONS = {
  APA: `${PAPER.authorFull}. (${PAPER.year}). ${PAPER.title}. <em>${PAPER.journal}</em>. https://doi.org/${PAPER.doi}`,
  MLA: `${PAPER.authorFull}. "${PAPER.title}." <em>${PAPER.journal}</em>, ${PAPER.year}. DOI: ${PAPER.doi}.`,
  Chicago: `${PAPER.authorFull}. "${PAPER.title}." <em>${PAPER.journal}</em> (${PAPER.year}). https://doi.org/${PAPER.doi}.`,
  Vancouver: `${PAPER.author}. ${PAPER.title}. ${PAPER.journal}. ${PAPER.year}. Available from: https://doi.org/${PAPER.doi}`,
  BibTeX: `@article{kadam${PAPER.year},\n  author    = {${PAPER.authorFull}},\n  title     = {${PAPER.title}},\n  journal   = {${PAPER.journal}},\n  year      = {${PAPER.year}},\n  doi       = {${PAPER.doi}}\n}`,
};

function initCitation() {
  const btn = document.getElementById('cite-btn');
  const modal = document.getElementById('citation-modal');
  const closeBtn = document.getElementById('citation-close');
  const display = document.getElementById('citation-display');
  const tabs = document.querySelectorAll('.cit-tab');
  const copyBtn = document.getElementById('copy-citation');
  if (!btn || !modal) return;

  let currentFormat = 'APA';

  function showCitation(fmt) {
    currentFormat = fmt;
    display.innerHTML = CITATIONS[fmt];
    tabs.forEach(t => t.classList.toggle('active', t.dataset.fmt === fmt));
  }

  btn.addEventListener('click', () => { modal.classList.add('open'); showCitation('APA'); });
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  tabs.forEach(t => t.addEventListener('click', () => showCitation(t.dataset.fmt)));

  copyBtn.addEventListener('click', () => {
    const text = display.innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy Citation'; copyBtn.classList.remove('copied'); }, 2000);
    });
  });
}

/* ---------- Lightbox ---------- */
function initLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');
  if (!lb) return;

  document.querySelectorAll('[data-lightbox]').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lbImg.src = img.src || img.dataset.src;
      lbCap.textContent = img.dataset.caption || img.alt || '';
      lb.classList.add('open');
    });
  });

  lbClose.addEventListener('click', () => lb.classList.remove('open'));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });
}

/* ---------- Share ---------- */
function initShare() {
  const btn = document.getElementById('share-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        btn.textContent = '✓ Link Copied';
        setTimeout(() => btn.innerHTML = '🔗 <span>Share</span>', 2000);
      });
    }
  });
}

/* ---------- Print ---------- */
function initPrint() {
  const btn = document.getElementById('print-btn');
  if (btn) btn.addEventListener('click', () => window.print());
}

/* ---------- PDF Download ---------- */
function initPDF() {
  const btns = document.querySelectorAll('.pdf-download-btn, #floating-pdf');
  btns.forEach(b => b.addEventListener('click', () => {
    const path = 'Publication_Ready_Manuscript.pdf';
    const a = document.createElement('a');
    a.href = path; a.download = 'Research_Paper.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }));
}

/* ---------- Collapsible Sections ---------- */
function initCollapsible() {
  document.querySelectorAll('.collapsible-toggle').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    target.style.maxHeight = target.scrollHeight + 'px';
    btn.addEventListener('click', () => {
      const isOpen = target.style.maxHeight !== '0px';
      target.style.maxHeight = isOpen ? '0px' : target.scrollHeight + 'px';
      btn.querySelector('.toggle-icon').textContent = isOpen ? '▶' : '▼';
    });
  });
}

/* ---------- Smooth Scroll for Anchor Links ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ---------- Text Selection Copy Paragraph Link ---------- */
function initTextSelection() {
  let popup;
  document.getElementById('content-area')?.addEventListener('mouseup', () => {
    const sel = window.getSelection();
    if (!sel || sel.toString().trim().length < 15) {
      if (popup) popup.remove();
      return;
    }
    if (popup) popup.remove();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup = document.createElement('div');
    popup.style.cssText = `position:fixed;top:${rect.top - 40 + window.scrollY}px;left:${rect.left + rect.width/2}px;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:5px 14px;border-radius:50px;font-size:0.75rem;font-weight:600;cursor:pointer;z-index:5000;box-shadow:0 4px 16px rgba(0,0,0,0.3);`;
    popup.textContent = '📋 Copy';
    popup.addEventListener('click', () => {
      navigator.clipboard.writeText(sel.toString());
      popup.textContent = '✓ Copied';
      setTimeout(() => popup?.remove(), 1200);
    });
    document.body.appendChild(popup);
    setTimeout(() => { if (popup) popup.remove(); }, 3000);
  });
}

/* ---------- Lazy Load Images ---------- */
function initLazyLoad() {
  const imgs = document.querySelectorAll('img[data-src]');
  if (!imgs.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        e.target.removeAttribute('data-src');
        obs.unobserve(e.target);
      }
    });
  });
  imgs.forEach(img => obs.observe(img));
}

/* ---------- Init All ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initReadingTime();
  initBackToTop();
  initDarkMode();
  initTOC();
  initSearch();
  initCitation();
  initLightbox();
  initShare();
  initPrint();
  initPDF();
  initCollapsible();
  initSmoothScroll();
  initTextSelection();
  initLazyLoad();
});

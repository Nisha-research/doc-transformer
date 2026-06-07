// Export a SlideDeck spec to a real .pptx using pptxgenjs.
import PptxGenJS from 'pptxgenjs';
import type { SlideDeck, Slide } from './slides-api';

function safeHex(c: string | undefined, fallback: string): string {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c.slice(1) : fallback;
}

export async function exportDeckAsPptx(deck: SlideDeck) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
  pptx.title = deck.title || 'StudyForge Deck';

  const primary = safeHex(deck.theme?.primary, '1E2761');
  const accent = safeHex(deck.theme?.accent, 'F96167');
  const bg = safeHex(deck.theme?.bg, 'F8FAFC');
  const ink = safeHex(deck.theme?.ink, '0F172A');
  const muted = '64748B';

  const W = 13.33, H = 7.5;

  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: bg };

    // Top accent bar
    slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.18, fill: { color: primary } });
    // Footer line
    slide.addText('StudyForge', {
      x: 0.5, y: H - 0.4, w: 4, h: 0.3, fontSize: 9, color: muted, fontFace: 'Calibri',
    });

    if (s.layout === 'title') {
      slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: primary } });
      slide.addText(s.title || deck.title, {
        x: 0.8, y: 2.6, w: W - 1.6, h: 1.6,
        fontSize: 54, bold: true, color: 'FFFFFF', fontFace: 'Calibri', align: 'left',
      });
      slide.addText(s.subtitle || deck.subtitle || '', {
        x: 0.8, y: 4.3, w: W - 1.6, h: 0.8,
        fontSize: 22, color: 'FFFFFF', fontFace: 'Calibri', align: 'left',
      });
      slide.addShape('rect', { x: 0.8, y: 4.0, w: 1.2, h: 0.08, fill: { color: accent } });
    } else if (s.layout === 'section') {
      slide.addText((s.subtitle || 'Section').toUpperCase(), {
        x: 0.8, y: 2.6, w: W - 1.6, h: 0.5, fontSize: 16, color: accent, bold: true, fontFace: 'Calibri', charSpacing: 6,
      });
      slide.addText(s.title, {
        x: 0.8, y: 3.1, w: W - 1.6, h: 1.4, fontSize: 48, bold: true, color: ink, fontFace: 'Calibri',
      });
    } else if (s.layout === 'stat') {
      slide.addText(s.title, {
        x: 0.8, y: 0.6, w: W - 1.6, h: 0.8, fontSize: 28, bold: true, color: ink, fontFace: 'Calibri',
      });
      slide.addText(s.stat?.value || '—', {
        x: 0.8, y: 2.0, w: W - 1.6, h: 2.6, fontSize: 120, bold: true, color: accent, fontFace: 'Calibri', align: 'center', valign: 'middle',
      });
      slide.addText(s.stat?.label || '', {
        x: 0.8, y: 4.8, w: W - 1.6, h: 0.6, fontSize: 22, color: ink, fontFace: 'Calibri', align: 'center', bold: true,
      });
      if (s.stat?.context) {
        slide.addText(s.stat.context, {
          x: 1.5, y: 5.5, w: W - 3, h: 1.0, fontSize: 16, color: muted, fontFace: 'Calibri', align: 'center', italic: true,
        });
      }
    } else if (s.layout === 'quote') {
      slide.addText('"', { x: 0.8, y: 1.2, w: 2, h: 2, fontSize: 160, bold: true, color: accent, fontFace: 'Georgia' });
      slide.addText(s.quote?.text || s.title, {
        x: 1.5, y: 2.4, w: W - 3, h: 3, fontSize: 28, italic: true, color: ink, fontFace: 'Georgia', valign: 'middle',
      });
      if (s.quote?.author) {
        slide.addText(`— ${s.quote.author}`, {
          x: 1.5, y: 5.8, w: W - 3, h: 0.5, fontSize: 16, color: muted, fontFace: 'Calibri', align: 'right',
        });
      }
    } else if (s.layout === 'two-column') {
      slide.addText(s.title, { x: 0.8, y: 0.5, w: W - 1.6, h: 0.9, fontSize: 32, bold: true, color: ink, fontFace: 'Calibri' });
      slide.addShape('rect', { x: 0.8, y: 1.4, w: 0.8, h: 0.08, fill: { color: accent } });
      const cols = (s.columns && s.columns.length ? s.columns : (s.bullets || []).slice(0, 2).map((b, i) => ({ heading: `Point ${i + 1}`, body: b }))).slice(0, 2);
      const colW = (W - 1.6 - 0.4) / 2;
      cols.forEach((c, i) => {
        const cx = 0.8 + i * (colW + 0.4);
        slide.addShape('roundRect', { x: cx, y: 1.9, w: colW, h: 4.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0' }, rectRadius: 0.12 });
        slide.addText(c.heading || '', { x: cx + 0.3, y: 2.1, w: colW - 0.6, h: 0.6, fontSize: 20, bold: true, color: primary, fontFace: 'Calibri' });
        slide.addText(c.body || '', { x: cx + 0.3, y: 2.8, w: colW - 0.6, h: 3.5, fontSize: 16, color: ink, fontFace: 'Calibri', valign: 'top' });
      });
    } else {
      // bullets / conclusion (default)
      const eyebrow = s.layout === 'conclusion' ? 'KEY TAKEAWAYS' : (s.subtitle?.toUpperCase() ?? '');
      if (eyebrow) {
        slide.addText(eyebrow, { x: 0.8, y: 0.5, w: W - 1.6, h: 0.4, fontSize: 13, color: accent, bold: true, fontFace: 'Calibri', charSpacing: 5 });
      }
      slide.addText(s.title, { x: 0.8, y: 0.95, w: W - 1.6, h: 0.9, fontSize: 34, bold: true, color: ink, fontFace: 'Calibri' });
      slide.addShape('rect', { x: 0.8, y: 1.85, w: 0.8, h: 0.08, fill: { color: accent } });
      const items = (s.bullets || []).slice(0, 6).map(b => ({ text: b, options: { bullet: { code: '25CF' }, color: ink, fontSize: 20, fontFace: 'Calibri', paraSpaceAfter: 12 } }));
      if (items.length) {
        slide.addText(items as any, { x: 0.9, y: 2.2, w: W - 1.8, h: H - 3.0, valign: 'top' });
      }
    }

    if (s.notes) slide.addNotes(s.notes);
  }

  const fileBase = (deck.title || 'studyforge-deck').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
  await pptx.writeFile({ fileName: `${fileBase}.pptx` });
}

export function newSlide(layout: Slide['layout'] = 'bullets'): Slide {
  return {
    id: `slide-${Math.random().toString(36).slice(2, 9)}`,
    layout,
    title: 'New slide',
    bullets: layout === 'bullets' || layout === 'conclusion' ? ['Add a point'] : undefined,
    columns: layout === 'two-column' ? [{ heading: 'Column A', body: '' }, { heading: 'Column B', body: '' }] : undefined,
    stat: layout === 'stat' ? { value: '00%', label: 'metric' } : undefined,
    quote: layout === 'quote' ? { text: 'A memorable quote.', author: 'Author' } : undefined,
    notes: '',
  };
}

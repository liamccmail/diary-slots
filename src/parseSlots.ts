export interface ParsedSlot {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const MONTHS: Record<string, number> = {
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
  jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
  january:1,february:2,march:3,april:4,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
};

function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?$/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  const ampm = m[3]?.toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

function parseDate(text: string, year: number): string | null {
  // DD/MM/YYYY or DD/MM
  let m = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?\b/);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])) : year;
    return `${y}-${String(parseInt(m[2])).padStart(2,'0')}-${String(parseInt(m[1])).padStart(2,'0')}`;
  }
  // "23rd June", "June 23", "23 June"
  m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)/i);
  if (!m) m = text.match(/\b(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (m) {
    let day: number, monthStr: string;
    if (/^\d/.test(m[1])) { day = parseInt(m[1]); monthStr = m[2]; }
    else { monthStr = m[1]; day = parseInt(m[2]); }
    const month = MONTHS[monthStr.toLowerCase().replace(/[^a-z]/g,'').slice(0,9)];
    if (month) return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  return null;
}

export function parseAvailabilityText(text: string): ParsedSlot[] {
  const year = new Date().getFullYear();
  const results: ParsedSlot[] = [];
  let currentDate: string | null = null;

  const lines = text.split(/[\n;]/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateFound = parseDate(trimmed, year);
    if (dateFound) currentDate = dateFound;

    // Match all time ranges: 9-10, 9:00-10:00, 9am-10am, 9:30 - 10:30, 14:00–15:00
    const timeRangeRx = /(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/gi;
    let match;
    while ((match = timeRangeRx.exec(trimmed)) !== null) {
      if (!currentDate) continue;
      const start = parseTime(match[1].replace(/\s+/g,''));
      const end   = parseTime(match[2].replace(/\s+/g,''));
      if (start && end && start < end) {
        results.push({ date: currentDate, startTime: start, endTime: end });
      }
    }
  }

  return results;
}

export function formatParsedSlot(s: ParsedSlot): string {
  const d = new Date(s.date + 'T00:00:00');
  const label = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
  return `${label}  ${s.startTime}–${s.endTime}`;
}

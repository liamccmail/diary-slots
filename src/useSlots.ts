import { useState, useEffect } from 'react';
import type { Director, TimeSlot } from './types';

const SLOTS_KEY = 'diary-slots-v6';
const DIRECTORS_KEY = 'diary-directors-v4';

const PALETTE = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6','#a855f7'];

const DEFAULT_DIRECTORS: Director[] = [
  'Steve Partridge','Nick Carlisle','Chris Newman','Julia Hovells','Lisa McGrath',
  'Kelsey Walker','Mel Madjitey','Cassie Berry','Maxine Loftus','Julian Paine','Jo Casey',
].map((name, i) => ({ id: `default-${i}`, name, color: PALETTE[i % PALETTE.length] }));

// Sample data only loaded in dev — production starts empty
// default-0 Steve Partridge  default-1 Nick Carlisle   default-2 Chris Newman
// default-3 Julia Hovells    default-4 Lisa McGrath    default-5 Kelsey Walker
// default-6 Mel Madjitey     default-7 Cassie Berry    default-8 Maxine Loftus
// default-9 Julian Paine     default-10 Jo Casey
const DEV_SLOTS: TimeSlot[] = [
  // ── Deepak — RP In Person (Steve + Cassie) — 3 slots ─────────────────
  {
    id: 'sample-1', date: '2026-07-08', startTime: '10:00', endTime: '11:00',
    directorIds: ['default-0', 'default-7'], sentTo: 'Deepak', purpose: 'RP — In Person',
    status: 'declined', appointmentType: 'in-person',
    sentAt: '2026-07-04T09:00:00.000Z', notes: 'Prefers morning if possible',
  },
  {
    id: 'sample-2', date: '2026-07-10', startTime: '14:00', endTime: '15:00',
    directorIds: ['default-0', 'default-7'], sentTo: 'Deepak', purpose: 'RP — In Person',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-04T09:00:00.000Z', notes: 'Prefers morning if possible',
  },
  {
    id: 'sample-3', date: '2026-07-14', startTime: '11:00', endTime: '12:00',
    directorIds: ['default-0', 'default-7'], sentTo: 'Deepak', purpose: 'RP — In Person',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-04T09:00:00.000Z', notes: '',
  },

  // ── Margaret — Street Strategy (Steve) — 3 slots ─────────────────────
  {
    id: 'sample-4', date: '2026-07-09', startTime: '09:00', endTime: '10:00',
    directorIds: ['default-0'], sentTo: 'Margaret', purpose: 'Street — Teams/Zoom',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-05T10:00:00.000Z', notes: 'Needs to be after the MGHLN meeting 10am 24th',
  },
  {
    id: 'sample-5', date: '2026-07-11', startTime: '13:00', endTime: '14:00',
    directorIds: ['default-0'], sentTo: 'Margaret', purpose: 'Street — Teams/Zoom',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-05T10:00:00.000Z', notes: '',
  },
  {
    id: 'sample-6', date: '2026-07-15', startTime: '15:00', endTime: '16:00',
    directorIds: ['default-0'], sentTo: 'Margaret', purpose: 'Street — Teams/Zoom',
    status: 'accepted', appointmentType: 'online',
    sentAt: '2026-07-05T10:00:00.000Z', notes: '',
  },

  // ── James Whitfield — Annual Review (Nick + Julia) — 4 slots ─────────
  {
    id: 'sample-7', date: '2026-07-07', startTime: '09:30', endTime: '10:30',
    directorIds: ['default-1', 'default-3'], sentTo: 'James Whitfield', purpose: 'Annual Review',
    status: 'declined', appointmentType: 'in-person',
    sentAt: '2026-07-03T14:00:00.000Z', notes: 'Client travelling week of 14th',
  },
  {
    id: 'sample-8', date: '2026-07-09', startTime: '14:00', endTime: '15:00',
    directorIds: ['default-1', 'default-3'], sentTo: 'James Whitfield', purpose: 'Annual Review',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-03T14:00:00.000Z', notes: 'Client travelling week of 14th',
  },
  {
    id: 'sample-9', date: '2026-07-10', startTime: '11:00', endTime: '12:00',
    directorIds: ['default-1', 'default-3'], sentTo: 'James Whitfield', purpose: 'Annual Review',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-03T14:00:00.000Z', notes: '',
  },
  {
    id: 'sample-10', date: '2026-07-16', startTime: '10:00', endTime: '11:00',
    directorIds: ['default-1', 'default-3'], sentTo: 'James Whitfield', purpose: 'Annual Review',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-03T14:00:00.000Z', notes: '',
  },

  // ── Priya Patel — Portfolio Restructure (Chris + Lisa + Kelsey) — 3 slots
  {
    id: 'sample-11', date: '2026-07-08', startTime: '14:30', endTime: '16:00',
    directorIds: ['default-2', 'default-4', 'default-5'], sentTo: 'Priya Patel', purpose: 'Portfolio Restructure',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-06T08:30:00.000Z', notes: 'Complex agenda — allow 90 mins minimum',
  },
  {
    id: 'sample-12', date: '2026-07-11', startTime: '10:00', endTime: '11:30',
    directorIds: ['default-2', 'default-4', 'default-5'], sentTo: 'Priya Patel', purpose: 'Portfolio Restructure',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-06T08:30:00.000Z', notes: '',
  },
  {
    id: 'sample-13', date: '2026-07-17', startTime: '13:00', endTime: '14:30',
    directorIds: ['default-2', 'default-4', 'default-5'], sentTo: 'Priya Patel', purpose: 'Portfolio Restructure',
    status: 'accepted', appointmentType: 'online',
    sentAt: '2026-07-06T08:30:00.000Z', notes: '',
  },

  // ── Robert Chen — Investment Strategy (Maxine + Julian) — 2 slots ─────
  {
    id: 'sample-14', date: '2026-07-10', startTime: '09:00', endTime: '10:00',
    directorIds: ['default-8', 'default-9'], sentTo: 'Robert Chen', purpose: 'Investment Strategy Review',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-06T11:00:00.000Z', notes: '',
  },
  {
    id: 'sample-15', date: '2026-07-14', startTime: '15:00', endTime: '16:00',
    directorIds: ['default-8', 'default-9'], sentTo: 'Robert Chen', purpose: 'Investment Strategy Review',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-06T11:00:00.000Z', notes: 'Robert prefers afternoons',
  },

  // ── Sarah Collins — Estate Planning (Jo + Mel) — 3 slots ─────────────
  {
    id: 'sample-16', date: '2026-07-08', startTime: '11:00', endTime: '12:00',
    directorIds: ['default-10', 'default-6'], sentTo: 'Sarah Collins', purpose: 'Estate Planning',
    status: 'declined', appointmentType: 'in-person',
    sentAt: '2026-07-04T15:00:00.000Z', notes: '',
  },
  {
    id: 'sample-17', date: '2026-07-13', startTime: '10:00', endTime: '11:00',
    directorIds: ['default-10', 'default-6'], sentTo: 'Sarah Collins', purpose: 'Estate Planning',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-04T15:00:00.000Z', notes: 'Bring trust documents',
  },
  {
    id: 'sample-18', date: '2026-07-15', startTime: '14:00', endTime: '15:00',
    directorIds: ['default-10', 'default-6'], sentTo: 'Sarah Collins', purpose: 'Estate Planning',
    status: 'sent', appointmentType: 'in-person',
    sentAt: '2026-07-04T15:00:00.000Z', notes: '',
  },

  // ── Tom Hargreaves — Tax Review (Steve + Nick) — single slot ─────────
  {
    id: 'sample-19', date: '2026-07-11', startTime: '09:00', endTime: '10:00',
    directorIds: ['default-0', 'default-1'], sentTo: 'Tom Hargreaves', purpose: 'Tax Review',
    status: 'accepted', appointmentType: 'online',
    sentAt: '2026-07-07T08:00:00.000Z', notes: 'Confirmed via email',
  },

  // ── Emma Blackwood — Pension Review (Julia + Cassie) — 2 slots ────────
  {
    id: 'sample-20', date: '2026-07-09', startTime: '11:30', endTime: '12:30',
    directorIds: ['default-3', 'default-7'], sentTo: 'Emma Blackwood', purpose: 'Pension Review',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-05T16:00:00.000Z', notes: '',
  },
  {
    id: 'sample-21', date: '2026-07-16', startTime: '09:30', endTime: '10:30',
    directorIds: ['default-3', 'default-7'], sentTo: 'Emma Blackwood', purpose: 'Pension Review',
    status: 'sent', appointmentType: 'online',
    sentAt: '2026-07-05T16:00:00.000Z', notes: 'Emma requested morning slots only',
  },
];

const DEFAULT_SLOTS: TimeSlot[] = import.meta.env.DEV ? DEV_SLOTS : [];

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Returns the gap in minutes between two non-overlapping slots, or null if they overlap
function gapBetween(a: TimeSlot, b: TimeSlot): number | null {
  if (a.date !== b.date) return null;
  const aEnd = timeToMins(a.endTime), aStart = timeToMins(a.startTime);
  const bEnd = timeToMins(b.endTime), bStart = timeToMins(b.startTime);
  if (aEnd <= bStart) return bStart - aEnd;
  if (bEnd <= aStart) return aStart - bEnd;
  return null; // overlapping — already caught by conflict detection
}

export function useSlots() {
  const [directors, setDirectors] = useState<Director[]>(() => {
    // Clear stale keys from earlier versions
    ['diary-directors','diary-directors-v2','diary-slots','diary-slots-v2'].forEach(k => localStorage.removeItem(k));
    const stored = load<Director[]>(DIRECTORS_KEY, []);
    // If no stored directors, or stored directors don't include any real names, seed defaults
    const hasRealData = stored.some(d => DEFAULT_DIRECTORS.some(dd => dd.name === d.name));
    return stored.length > 0 && hasRealData ? stored : DEFAULT_DIRECTORS;
  });
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    ['diary-slots-v2','diary-slots-v3','diary-slots-v4','diary-slots-v5'].forEach(k => localStorage.removeItem(k));
    return load(SLOTS_KEY, DEFAULT_SLOTS);
  });

  useEffect(() => { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); }, [slots]);
  useEffect(() => { localStorage.setItem(DIRECTORS_KEY, JSON.stringify(directors)); }, [directors]);

  function addDirector(firstName: string, lastName: string, position?: string) {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const color = PALETTE[directors.length % PALETTE.length];
    const d: Director = { id: crypto.randomUUID(), name, position: position?.trim() || undefined, color };
    setDirectors(prev => [...prev, d]);
    return d;
  }

  // Re-adds any default director that's been removed, preserving their original id/color
  function restoreMissingDefaults() {
    setDirectors(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const missing = DEFAULT_DIRECTORS.filter(d => !existingIds.has(d.id));
      if (missing.length === 0) return prev;
      // Insert each missing director back into their original position
      const merged = [...prev];
      missing.forEach(md => {
        const idx = DEFAULT_DIRECTORS.indexOf(md);
        merged.splice(idx, 0, md);
      });
      return merged;
    });
  }

  function removeDirector(id: string) {
    setDirectors(prev => prev.filter(d => d.id !== id));
    setSlots(prev => prev.filter(s => s.directorIds.some(did => did !== id) || s.directorIds.length > 1)
      .map(s => ({ ...s, directorIds: s.directorIds.filter(did => did !== id) }))
      .filter(s => s.directorIds.length > 0));
  }

  function addSlot(slot: Omit<TimeSlot, 'id' | 'sentAt'>): TimeSlot {
    const newSlot: TimeSlot = { ...slot, id: crypto.randomUUID(), sentAt: new Date().toISOString() };
    setSlots(prev => [newSlot, ...prev]);
    return newSlot;
  }

  function updateSlot(id: string, data: Omit<TimeSlot, 'id' | 'sentAt'>): TimeSlot {
    const existing = slots.find(s => s.id === id)!;
    const updated: TimeSlot = { ...data, id, sentAt: existing.sentAt };
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }

  // IDs of all active slots that have a ≤15 min gap with another active slot sharing a director
  function getShortWindowIds(): Set<string> {
    const affected = new Set<string>();
    const active = slots.filter(s => s.status !== 'declined' && s.status !== 'expired');
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const gap = gapBetween(active[i], active[j]);
        if (gap === null || gap > 15) continue;
        const shared = active[i].directorIds.filter(id => active[j].directorIds.includes(id));
        if (shared.length === 0) continue;
        affected.add(active[i].id);
        affected.add(active[j].id);
      }
    }
    return affected;
  }

  // Given a freshly-created slot, find existing slots within 15 mins that share a director
  function findShortWindowNeighbors(newSlot: TimeSlot): Array<{ neighbor: TimeSlot; sharedDirectorIds: string[]; gapMins: number }> {
    return slots
      .filter(s => s.status !== 'declined' && s.status !== 'expired')
      .flatMap(s => {
        const gap = gapBetween(newSlot, s);
        if (gap === null || gap > 15) return [];
        const shared = newSlot.directorIds.filter(id => s.directorIds.includes(id));
        if (shared.length === 0) return [];
        return [{ neighbor: s, sharedDirectorIds: shared, gapMins: gap }];
      });
  }

  function updateStatus(id: string, status: TimeSlot['status']) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  function deleteSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  // Returns slots that overlap for any of the given directors
  function findConflicts(date: string, startTime: string, endTime: string, directorIds: string[], excludeId?: string): TimeSlot[] {
    return slots.filter(s => {
      if (s.id === excludeId) return false;
      if (s.date !== date) return false;
      if (s.status === 'declined' || s.status === 'expired') return false;
      if (!s.directorIds.some(did => directorIds.includes(did))) return false;
      return s.startTime < endTime && s.endTime > startTime;
    });
  }

  // How many active slots (including this one) share the same director + overlap this window
  function getOverlapCount(slot: TimeSlot): number {
    return slots.filter(s => {
      if (s.status === 'declined' || s.status === 'expired') return false;
      if (s.date !== slot.date) return false;
      if (!s.directorIds.some(did => slot.directorIds.includes(did))) return false;
      return s.startTime < slot.endTime && s.endTime > slot.startTime;
    }).length; // includes the slot itself, so 1 = only this one
  }

  return { directors, slots, addDirector, removeDirector, restoreMissingDefaults, addSlot, updateSlot, updateStatus, deleteSlot, findConflicts, getOverlapCount, getShortWindowIds, findShortWindowNeighbors };
}

import { useState, useEffect } from 'react';
import type { Director, TimeSlot } from './types';

const SLOTS_KEY = 'diary-slots-v3';
const DIRECTORS_KEY = 'diary-directors-v3';

const PALETTE = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6','#a855f7'];

const DEFAULT_DIRECTORS: Director[] = [
  'Steve Partridge','Nick Carlisle','Chris Newman','Julia Hovells','Lisa McGrath',
  'Kelsey Walker','Mel Madjitey','Cassie Berry','Maxine Loftus','Julian Paine','Jo Casey',
].map((name, i) => ({ id: `default-${i}`, name, color: PALETTE[i % PALETTE.length] }));

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
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
  const [slots, setSlots] = useState<TimeSlot[]>(() => load(SLOTS_KEY, []));

  useEffect(() => { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); }, [slots]);
  useEffect(() => { localStorage.setItem(DIRECTORS_KEY, JSON.stringify(directors)); }, [directors]);

  function addDirector(name: string) {
    const color = PALETTE[directors.length % PALETTE.length];
    const d: Director = { id: crypto.randomUUID(), name: name.trim(), color };
    setDirectors(prev => [...prev, d]);
    return d;
  }

  function removeDirector(id: string) {
    setDirectors(prev => prev.filter(d => d.id !== id));
    setSlots(prev => prev.filter(s => s.directorIds.some(did => did !== id) || s.directorIds.length > 1)
      .map(s => ({ ...s, directorIds: s.directorIds.filter(did => did !== id) }))
      .filter(s => s.directorIds.length > 0));
  }

  function addSlot(slot: Omit<TimeSlot, 'id' | 'sentAt'>) {
    const newSlot: TimeSlot = { ...slot, id: crypto.randomUUID(), sentAt: new Date().toISOString() };
    setSlots(prev => [newSlot, ...prev]);
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

  return { directors, slots, addDirector, removeDirector, addSlot, updateStatus, deleteSlot, findConflicts, getOverlapCount };
}

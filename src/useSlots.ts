import { useState, useEffect } from 'react';
import type { TimeSlot } from './types';

const STORAGE_KEY = 'diary-slots';

function load(): TimeSlot[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  function addSlot(slot: Omit<TimeSlot, 'id' | 'sentAt'>) {
    const newSlot: TimeSlot = {
      ...slot,
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
    };
    setSlots(prev => [newSlot, ...prev]);
  }

  function updateStatus(id: string, status: TimeSlot['status']) {
    setSlots(prev =>
      prev.map(s => (s.id === id ? { ...s, status } : s))
    );
  }

  function deleteSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  // Returns slots that overlap with a given date+time range
  function findConflicts(date: string, startTime: string, endTime: string, excludeId?: string): TimeSlot[] {
    return slots.filter(s => {
      if (s.id === excludeId) return false;
      if (s.date !== date) return false;
      if (s.status === 'declined' || s.status === 'expired') return false;
      // overlap when: s.start < endTime AND s.end > startTime
      return s.startTime < endTime && s.endTime > startTime;
    });
  }

  return { slots, addSlot, updateStatus, deleteSlot, findConflicts };
}

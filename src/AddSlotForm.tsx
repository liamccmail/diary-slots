import { useState } from 'react';
import type { TimeSlot } from './types';

interface Props {
  onAdd: (slot: Omit<TimeSlot, 'id' | 'sentAt'>) => void;
  conflicts: TimeSlot[];
  onCheckConflicts: (date: string, start: string, end: string) => void;
}

const empty = {
  date: '',
  startTime: '',
  endTime: '',
  sentTo: '',
  purpose: '',
  status: 'sent' as const,
  notes: '',
};

export default function AddSlotForm({ onAdd, conflicts, onCheckConflicts }: Props) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  function set(key: keyof typeof empty, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (next.date && next.startTime && next.endTime) {
      onCheckConflicts(next.date, next.startTime, next.endTime);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.startTime || !form.endTime || !form.sentTo || !form.purpose) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.startTime >= form.endTime) {
      setError('End time must be after start time.');
      return;
    }
    setError('');
    onAdd(form);
    setForm(empty);
  }

  return (
    <form onSubmit={submit} className="add-form">
      <h2>Log a sent availability slot</h2>

      {conflicts.length > 0 && (
        <div className="conflict-warning">
          Warning: {conflicts.length} overlapping slot{conflicts.length > 1 ? 's' : ''} already sent for this time.
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <label>
          Date *
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </label>
        <label>
          Start *
          <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
        </label>
        <label>
          End *
          <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label>
          Sent to *
          <input
            type="text"
            placeholder="Name or email"
            value={form.sentTo}
            onChange={e => set('sentTo', e.target.value)}
          />
        </label>
        <label>
          Purpose *
          <input
            type="text"
            placeholder="Meeting subject"
            value={form.purpose}
            onChange={e => set('purpose', e.target.value)}
          />
        </label>
      </div>

      <label>
        Notes
        <input
          type="text"
          placeholder="Optional notes"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </label>

      <button type="submit">Add slot</button>
    </form>
  );
}

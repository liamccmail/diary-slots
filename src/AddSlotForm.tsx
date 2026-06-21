import { useState } from 'react';
import type { Director, TimeSlot } from './types';

interface Props {
  directors: Director[];
  onAdd: (slot: Omit<TimeSlot, 'id' | 'sentAt'>) => void;
  conflicts: TimeSlot[];
  conflictDirectorNames: string[];
  onCheckConflicts: (date: string, start: string, end: string, directorIds: string[]) => void;
}

const empty = {
  date: '',
  startTime: '',
  endTime: '',
  directorIds: [] as string[],
  sentTo: '',
  purpose: '',
  status: 'sent' as const,
  notes: '',
};

export default function AddSlotForm({ directors, onAdd, conflicts, conflictDirectorNames, onCheckConflicts }: Props) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  function setField(key: keyof typeof empty, value: string | string[]) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (next.date && next.startTime && next.endTime && next.directorIds.length > 0) {
      onCheckConflicts(next.date, next.startTime, next.endTime, next.directorIds);
    }
  }

  function toggleDirector(id: string) {
    const next = form.directorIds.includes(id)
      ? form.directorIds.filter(d => d !== id)
      : [...form.directorIds, id];
    setField('directorIds', next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.startTime || !form.endTime || !form.sentTo || !form.purpose) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.directorIds.length === 0) {
      setError('Please select at least one director.');
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
          Conflict: {conflictDirectorNames.join(', ')} {conflictDirectorNames.length > 1 ? 'are' : 'is'} already offered for an overlapping time.
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {directors.length === 0 ? (
        <p className="no-directors-hint">Add a director above before logging slots.</p>
      ) : (
        <div className="director-picker">
          <span className="picker-label">Directors *</span>
          <div className="director-chips">
            {directors.map(d => (
              <button
                key={d.id}
                type="button"
                className={`director-chip ${form.directorIds.includes(d.id) ? 'selected' : ''}`}
                style={form.directorIds.includes(d.id) ? { background: d.color, borderColor: d.color, color: '#fff' } : { borderColor: d.color, color: d.color }}
                onClick={() => toggleDirector(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-row">
        <label>
          Date *
          <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
        </label>
        <label>
          Start *
          <input type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
        </label>
        <label>
          End *
          <input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label>
          Sent to *
          <input type="text" placeholder="Client name or email" value={form.sentTo} onChange={e => setField('sentTo', e.target.value)} />
        </label>
        <label>
          Purpose *
          <input type="text" placeholder="Meeting subject" value={form.purpose} onChange={e => setField('purpose', e.target.value)} />
        </label>
      </div>

      <label>
        Notes
        <input type="text" placeholder="Optional notes" value={form.notes} onChange={e => setField('notes', e.target.value)} />
      </label>

      <button type="submit">Add slot</button>
    </form>
  );
}

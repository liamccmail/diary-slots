import { useState, useEffect } from 'react';
import type { Director, TimeSlot, SlotStatus, AppointmentType } from './types';
import { parseAvailabilityText, formatParsedSlot, type ParsedSlot } from './parseSlots';

interface Props {
  directors: Director[];
  editingSlot?: TimeSlot;
  onAdd: (slot: Omit<TimeSlot, 'id' | 'sentAt'>) => void;
  onUpdate?: (id: string, data: Omit<TimeSlot, 'id' | 'sentAt'>) => void;
  conflicts: TimeSlot[];
  conflictDirectorNames: string[];
  onCheckConflicts: (date: string, start: string, end: string, directorIds: string[]) => void;
}

const emptyManual: {
  date: string; startTime: string; endTime: string;
  directorIds: string[]; sentTo: string; purpose: string;
  status: SlotStatus; appointmentType: AppointmentType; notes: string;
} = {
  date: '', startTime: '', endTime: '',
  directorIds: [],
  sentTo: '', purpose: '', status: 'sent',
  appointmentType: 'in-person', notes: '',
};

export default function AddSlotForm({ directors, editingSlot, onAdd, onUpdate, conflicts, conflictDirectorNames, onCheckConflicts }: Props) {
  const [mode, setMode] = useState<'manual' | 'paste'>('manual');
  const [manual, setManual] = useState(emptyManual);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSlot) {
      setManual({
        date: editingSlot.date,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        directorIds: editingSlot.directorIds,
        sentTo: editingSlot.sentTo,
        purpose: editingSlot.purpose,
        status: editingSlot.status,
        appointmentType: editingSlot.appointmentType ?? 'in-person',
        notes: editingSlot.notes ?? '',
      });
      setMode('manual');
    } else {
      setManual(emptyManual);
    }
  }, [editingSlot]);

  // Paste mode state
  const [pasteText, setPasteText] = useState('');
  const [parsedSlots, setParsedSlots] = useState<ParsedSlot[]>([]);
  const [pasteMeta, setPasteMeta] = useState({ directorIds: [] as string[], sentTo: '', purpose: '', appointmentType: 'in-person' as AppointmentType, notes: '' });
  const [pasteError, setPasteError] = useState('');

  // ── Manual mode ─────────────────────────────────────────
  function setField(key: keyof typeof emptyManual, value: string | string[]) {
    const next = { ...manual, [key]: value };
    setManual(next);
    if (next.date && next.startTime && next.endTime && next.directorIds.length > 0) {
      onCheckConflicts(next.date, next.startTime, next.endTime, next.directorIds);
    }
  }

  function toggleDir(id: string) {
    const next = manual.directorIds.includes(id)
      ? manual.directorIds.filter(d => d !== id)
      : [...manual.directorIds, id];
    setField('directorIds', next);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.date || !manual.startTime || !manual.endTime || !manual.sentTo || !manual.purpose) {
      setError('Please fill in all required fields.'); return;
    }
    if (manual.directorIds.length === 0) { setError('Select at least one director.'); return; }
    if (manual.startTime >= manual.endTime) { setError('End time must be after start time.'); return; }
    setError('');
    if (editingSlot && onUpdate) {
      onUpdate(editingSlot.id, manual);
    } else {
      onAdd(manual);
      setManual(emptyManual);
    }
  }

  // ── Paste mode ───────────────────────────────────────────
  function handlePasteChange(text: string) {
    setPasteText(text);
    setParsedSlots(parseAvailabilityText(text));
    setPasteError('');
  }

  function togglePasteDir(id: string) {
    setPasteMeta(m => ({
      ...m,
      directorIds: m.directorIds.includes(id)
        ? m.directorIds.filter(d => d !== id)
        : [...m.directorIds, id],
    }));
  }

  function submitPaste(e: React.FormEvent) {
    e.preventDefault();
    if (parsedSlots.length === 0) { setPasteError('No valid time slots detected — check the format hint below.'); return; }
    if (pasteMeta.directorIds.length === 0) { setPasteError('Select at least one director.'); return; }
    if (!pasteMeta.sentTo || !pasteMeta.purpose) { setPasteError('Sent to and Purpose are required.'); return; }
    parsedSlots.forEach(s => onAdd({ ...s, ...pasteMeta, status: 'sent' }));
    setPasteText('');
    setParsedSlots([]);
    setPasteMeta({ directorIds: [], sentTo: '', purpose: '', appointmentType: 'in-person', notes: '' });
    setPasteError('');
  }

  // ── Shared director chips ────────────────────────────────
  function DirectorChips({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
    if (directors.length === 0) return <p className="no-directors-hint">Add a director first.</p>;
    return (
      <div className="director-picker">
        <span className="picker-label">Directors *</span>
        <div className="director-chips">
          {directors.map(d => (
            <button
              key={d.id} type="button"
              className={`director-chip ${selected.includes(d.id) ? 'selected' : ''}`}
              style={selected.includes(d.id)
                ? { background: d.color, borderColor: d.color, color: '#fff' }
                : { borderColor: d.color, color: d.color }}
              onClick={() => onToggle(d.id)}
            >{d.name}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="add-form">
      {/* Mode toggle — hidden when editing */}
      {!editingSlot && (
        <div className="mode-tabs">
          <button className={`mode-tab ${mode === 'manual' ? 'active' : ''}`} type="button" onClick={() => setMode('manual')}>Manual entry</button>
          <button className={`mode-tab ${mode === 'paste' ? 'active' : ''}`} type="button" onClick={() => setMode('paste')}>Paste availability</button>
        </div>
      )}

      {/* ── Manual ── */}
      {mode === 'manual' && (
        <form onSubmit={submitManual}>
          {conflicts.length > 0 && (
            <div className="conflict-warning">
              Conflict: {conflictDirectorNames.join(', ')} {conflictDirectorNames.length > 1 ? 'are' : 'is'} already offered for this time.
            </div>
          )}
          {error && <div className="form-error">{error}</div>}

          <DirectorChips selected={manual.directorIds} onToggle={toggleDir} />

          <div className="appt-type-toggle">
            <span className="picker-label">Type</span>
            <div className="appt-type-pills">
              <button type="button" className={`appt-pill ${manual.appointmentType === 'in-person' ? 'active' : ''}`} onClick={() => setField('appointmentType', 'in-person')}>📍 In Person</button>
              <button type="button" className={`appt-pill ${manual.appointmentType === 'online' ? 'active' : ''}`} onClick={() => setField('appointmentType', 'online')}>💻 Online</button>
            </div>
          </div>

          <label>Date * <input type="date" value={manual.date} onChange={e => setField('date', e.target.value)} /></label>
          <div className="form-row">
            <label>Start * <input type="time" value={manual.startTime} onChange={e => setField('startTime', e.target.value)} /></label>
            <label>End * <input type="time" value={manual.endTime} onChange={e => setField('endTime', e.target.value)} /></label>
          </div>
          <div className="form-row">
            <label>Sent to * <input type="text" placeholder="Client name or email" value={manual.sentTo} onChange={e => setField('sentTo', e.target.value)} /></label>
            <label>Purpose * <input type="text" placeholder="Meeting subject" value={manual.purpose} onChange={e => setField('purpose', e.target.value)} /></label>
          </div>
          <label>Notes <input type="text" placeholder="Optional notes" value={manual.notes} onChange={e => setField('notes', e.target.value)} /></label>
          <button type="submit" className={editingSlot ? 'btn-save-edit' : ''}>
            {editingSlot ? 'Save changes' : 'Add slot'}
          </button>
        </form>
      )}

      {/* ── Paste ── */}
      {mode === 'paste' && (
        <form onSubmit={submitPaste}>
          {pasteError && <div className="form-error">{pasteError}</div>}

          <label className="paste-label">
            Paste your availability
            <textarea
              className="paste-area"
              placeholder={`Paste or type times, e.g.\n\nMon 23 Jun  9:00-10:00, 11:30-12:30\nTue 24 Jun  14:00-15:00\n25/06  9-10, 13-14`}
              value={pasteText}
              onChange={e => handlePasteChange(e.target.value)}
              rows={6}
            />
          </label>

          {parsedSlots.length > 0 && (
            <div className="parsed-preview">
              <span className="picker-label">Detected {parsedSlots.length} slot{parsedSlots.length > 1 ? 's' : ''}</span>
              <ul className="parsed-list">
                {parsedSlots.map((s, i) => <li key={i}>{formatParsedSlot(s)}</li>)}
              </ul>
            </div>
          )}

          <DirectorChips selected={pasteMeta.directorIds} onToggle={togglePasteDir} />

          <div className="appt-type-toggle">
            <span className="picker-label">Type</span>
            <div className="appt-type-pills">
              <button type="button" className={`appt-pill ${pasteMeta.appointmentType === 'in-person' ? 'active' : ''}`} onClick={() => setPasteMeta(m => ({ ...m, appointmentType: 'in-person' }))}>📍 In Person</button>
              <button type="button" className={`appt-pill ${pasteMeta.appointmentType === 'online' ? 'active' : ''}`} onClick={() => setPasteMeta(m => ({ ...m, appointmentType: 'online' }))}>💻 Online</button>
            </div>
          </div>

          <div className="form-row">
            <label>Sent to * <input type="text" placeholder="Client name or email" value={pasteMeta.sentTo} onChange={e => setPasteMeta(m => ({ ...m, sentTo: e.target.value }))} /></label>
            <label>Purpose * <input type="text" placeholder="Meeting subject" value={pasteMeta.purpose} onChange={e => setPasteMeta(m => ({ ...m, purpose: e.target.value }))} /></label>
          </div>
          <label>Notes <input type="text" placeholder="Optional notes" value={pasteMeta.notes} onChange={e => setPasteMeta(m => ({ ...m, notes: e.target.value }))} /></label>

          <button type="submit" disabled={parsedSlots.length === 0}>
            {parsedSlots.length > 0 ? `Add ${parsedSlots.length} slot${parsedSlots.length > 1 ? 's' : ''}` : 'Add slots'}
          </button>

          <p className="paste-hint">Supported: <code>23 Jun 9:00-10:00</code> · <code>23/06 9-10</code> · <code>Mon 23rd June 9am-5pm</code>. Multiple slots per line separated by commas.</p>
        </form>
      )}
    </div>
  );
}

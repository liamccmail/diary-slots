import type { Director, TimeSlot, SlotStatus } from './types';

interface Props {
  purpose: string;
  sentTo: string;
  slots: TimeSlot[];
  directors: Director[];
  overlapCounts: Record<string, number>;
  shortWindowIds: Set<string>;
  onStatusChange: (id: string, status: SlotStatus) => void;
  onRequestDelete: (id: string) => void;
  onRequestEdit: (slot: TimeSlot) => void;
}

const STATUS_LABELS: Record<SlotStatus, string> = {
  sent: 'Sent', accepted: 'Accepted', declined: 'Declined', expired: 'Expired',
};

function trafficColor(count: number, status: SlotStatus): string {
  if (status === 'declined' || status === 'expired') return '#94a3b8';
  if (count >= 3) return '#ef4444';
  if (count === 2) return '#f59e0b';
  return '#10b981';
}

function trafficLabel(count: number, status: SlotStatus): string {
  if (status === 'declined' || status === 'expired') return '';
  if (count >= 3) return `${count} overlapping — high risk`;
  if (count === 2) return `${count} overlapping — caution`;
  return 'Only sent once';
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Worst active traffic colour in the group drives the left border
function groupBorderColor(slots: TimeSlot[], overlapCounts: Record<string, number>): string {
  let worst = '#94a3b8';
  for (const s of slots) {
    const c = trafficColor(overlapCounts[s.id] ?? 1, s.status);
    if (c === '#ef4444') return c;
    if (c === '#f59e0b') worst = c;
    else if (worst === '#94a3b8' && c === '#10b981') worst = c;
  }
  return worst;
}

export default function SlotGroup({
  purpose, sentTo, slots, directors, overlapCounts, shortWindowIds,
  onStatusChange, onRequestDelete, onRequestEdit,
}: Props) {
  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const borderColor = groupBorderColor(slots, overlapCounts);

  return (
    <div className="slot-group" style={{ borderLeftColor: borderColor }}>
      {/* ── Group header ── */}
      <div className="slot-group-header">
        <div className="slot-group-title">
          <strong className="slot-group-purpose">{purpose}</strong>
          <span className="slot-person">→ {sentTo}</span>
        </div>
        <span className="slot-group-count">
          {slots.length} time slot{slots.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Per-slot entries ── */}
      <div className="slot-entries">
        {sorted.map((slot, i) => {
          const slotDirs = directors.filter(d => slot.directorIds.includes(d.id));
          const count = overlapCounts[slot.id] ?? 1;
          const color = trafficColor(count, slot.status);
          const label = trafficLabel(count, slot.status);
          const isShortWindow = shortWindowIds.has(slot.id);

          return (
            <div key={slot.id} className={`slot-entry${i > 0 ? ' slot-entry--divider' : ''}`}>
              <div className="slot-entry-top">
                <span className="slot-datetime">{formatDate(slot.date)} &nbsp; {slot.startTime}–{slot.endTime}</span>
                <div className="slot-header-right">
                  {label && (
                    <span className="traffic-pill" style={{ background: color + '22', color, borderColor: color + '55' }}>
                      <span className="traffic-dot" style={{ background: color }} />
                      {label}
                    </span>
                  )}
                  <span className={`badge badge-${slot.status}`}>{STATUS_LABELS[slot.status]}</span>
                </div>
              </div>

              <div className="slot-entry-meta">
                <div className="slot-directors">
                  {slotDirs.map(d => (
                    <span key={d.id} className="director-tag" style={{ background: d.color + '22', color: d.color, borderColor: d.color + '55' }}>
                      {d.name}
                    </span>
                  ))}
                </div>
                {slot.appointmentType && (
                  <span className={`appt-type-badge appt-type-${slot.appointmentType}`}>
                    {slot.appointmentType === 'in-person' ? '📍 In Person' : '💻 Online'}
                  </span>
                )}
              </div>

              {slot.notes && <p className="slot-notes">{slot.notes}</p>}
              <span className="slot-sent-at">Logged {formatSentAt(slot.sentAt)}</span>

              {isShortWindow && (
                <div className="short-window-flag">
                  <span>⚠</span> Short gap with another appointment
                </div>
              )}

              <div className="slot-actions">
                {(['sent', 'accepted', 'declined', 'expired'] as SlotStatus[])
                  .filter(s => s !== slot.status)
                  .map(s => (
                    <button key={s} className="btn-secondary" onClick={() => onStatusChange(slot.id, s)}>
                      Mark {STATUS_LABELS[s]}
                    </button>
                  ))}
                <button className="btn-edit" onClick={() => onRequestEdit(slot)}>Edit</button>
                <button className="btn-danger" onClick={() => onRequestDelete(slot.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

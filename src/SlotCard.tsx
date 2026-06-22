import type { Director, TimeSlot, SlotStatus } from './types';

interface Props {
  slot: TimeSlot;
  directors: Director[];
  overlapCount: number;
  onStatusChange: (id: string, status: SlotStatus) => void;
  onRequestDelete: (id: string) => void;
}

const STATUS_LABELS: Record<SlotStatus, string> = {
  sent: 'Sent', accepted: 'Accepted', declined: 'Declined', expired: 'Expired',
};

// Traffic light: based on how many active overlapping slots exist for same director+time
function trafficColor(count: number, status: SlotStatus): string {
  if (status === 'declined' || status === 'expired') return '#94a3b8'; // grey — not competing
  if (count >= 3) return '#ef4444'; // red
  if (count === 2) return '#f59e0b'; // amber
  return '#10b981'; // green
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

export default function SlotCard({ slot, directors, overlapCount, onStatusChange, onRequestDelete }: Props) {
  const slotDirectors = directors.filter(d => slot.directorIds.includes(d.id));
  const color = trafficColor(overlapCount, slot.status);
  const label = trafficLabel(overlapCount, slot.status);

  return (
    <div className="slot-card" style={{ borderLeftColor: color }}>
      <div className="slot-header">
        <span className="slot-datetime">
          {formatDate(slot.date)} &nbsp; {slot.startTime}–{slot.endTime}
        </span>
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

      <div className="slot-directors">
        {slotDirectors.map(d => (
          <span key={d.id} className="director-tag" style={{ background: d.color + '22', color: d.color, borderColor: d.color + '55' }}>
            {d.name}
          </span>
        ))}
      </div>

      <div className="slot-body">
        <strong>{slot.purpose}</strong>
        <span className="slot-person">→ {slot.sentTo}</span>
        {slot.appointmentType && (
          <span className={`appt-type-badge appt-type-${slot.appointmentType}`}>
            {slot.appointmentType === 'in-person' ? '📍 In Person' : '💻 Online'}
          </span>
        )}
        {slot.notes && <p className="slot-notes">{slot.notes}</p>}
        <span className="slot-sent-at">Logged {formatSentAt(slot.sentAt)}</span>
      </div>

      <div className="slot-actions">
        {(['sent', 'accepted', 'declined', 'expired'] as SlotStatus[])
          .filter(s => s !== slot.status)
          .map(s => (
            <button key={s} className="btn-secondary" onClick={() => onStatusChange(slot.id, s)}>
              Mark {STATUS_LABELS[s]}
            </button>
          ))}
        <button className="btn-danger" onClick={() => onRequestDelete(slot.id)}>Delete</button>
      </div>
    </div>
  );
}

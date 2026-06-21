import type { Director, TimeSlot, SlotStatus } from './types';

interface Props {
  slot: TimeSlot;
  directors: Director[];
  onStatusChange: (id: string, status: SlotStatus) => void;
  onDelete: (id: string) => void;
}

const STATUS_LABELS: Record<SlotStatus, string> = {
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

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

export default function SlotCard({ slot, directors, onStatusChange, onDelete }: Props) {
  const slotDirectors = directors.filter(d => slot.directorIds.includes(d.id));

  return (
    <div className={`slot-card status-${slot.status}`}>
      <div className="slot-header">
        <span className="slot-datetime">
          {formatDate(slot.date)} &nbsp; {slot.startTime}–{slot.endTime}
        </span>
        <span className={`badge badge-${slot.status}`}>{STATUS_LABELS[slot.status]}</span>
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
        <button className="btn-danger" onClick={() => onDelete(slot.id)}>Delete</button>
      </div>
    </div>
  );
}

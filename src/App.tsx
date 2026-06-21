import { useState } from 'react';
import { useSlots } from './useSlots';
import AddSlotForm from './AddSlotForm';
import SlotCard from './SlotCard';
import type { SlotStatus, TimeSlot } from './types';
import './App.css';

type Filter = 'all' | SlotStatus;

export default function App() {
  const { slots, addSlot, updateStatus, deleteSlot, findConflicts } = useSlots();
  const [filter, setFilter] = useState<Filter>('all');
  const [conflicts, setConflicts] = useState<TimeSlot[]>([]);

  const visible = filter === 'all' ? slots : slots.filter(s => s.status === filter);
  const activeSentCount = slots.filter(s => s.status === 'sent').length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Diary Slot Tracker</h1>
        <p className="subtitle">Track availability slots sent on behalf of the director</p>
        {activeSentCount > 0 && (
          <div className="active-count">
            {activeSentCount} slot{activeSentCount > 1 ? 's' : ''} awaiting response
          </div>
        )}
      </header>

      <main>
        <AddSlotForm
          onAdd={slot => { addSlot(slot); setConflicts([]); }}
          conflicts={conflicts}
          onCheckConflicts={(date, start, end) =>
            setConflicts(findConflicts(date, start, end))
          }
        />

        <section className="slot-list-section">
          <div className="filter-bar">
            {(['all', 'sent', 'accepted', 'declined', 'expired'] as Filter[]).map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="filter-count">
                  {f === 'all' ? slots.length : slots.filter(s => s.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="empty-state">No slots here yet.</p>
          ) : (
            visible.map(slot => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onStatusChange={updateStatus}
                onDelete={deleteSlot}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

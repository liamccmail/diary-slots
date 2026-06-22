import { useState, useEffect } from 'react';
import { useSlots } from './useSlots';
import AddSlotForm from './AddSlotForm';
import SlotCard from './SlotCard';
import ConfirmModal from './ConfirmModal';
import type { SlotStatus, TimeSlot } from './types';
import './App.css';

type StatusFilter = 'all' | SlotStatus;

export default function App() {
  const { directors, slots, addDirector, removeDirector, restoreMissingDefaults, addSlot, updateStatus, deleteSlot, findConflicts, getOverlapCount } = useSlots();

  const [activeDirectorId, setActiveDirectorId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchDirFilter, setSearchDirFilter] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 500);
    return () => clearTimeout(t);
  }, [searchText]);
  const [conflicts, setConflicts] = useState<TimeSlot[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addingDirector, setAddingDirector] = useState(false);
  const [newDir, setNewDir] = useState({ firstName: '', lastName: '', position: '' });
  const [removeModalId, setRemoveModalId] = useState<string | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  const tabSlots = activeDirectorId
    ? slots.filter(s => s.directorIds.includes(activeDirectorId))
    : slots;

  const visibleSlots = statusFilter === 'all'
    ? tabSlots
    : tabSlots.filter(s => s.status === statusFilter);

  const q = debouncedSearch.toLowerCase().trim();
  const searchedSlots = visibleSlots.filter(slot => {
    if (q && !slot.purpose.toLowerCase().includes(q) && !slot.sentTo.toLowerCase().includes(q)) return false;
    if (searchDirFilter.length > 0 && !searchDirFilter.every(id => slot.directorIds.includes(id))) return false;
    return true;
  });

  const isSearchActive = q.length > 0 || searchDirFilter.length > 0;

  function clearSearch() {
    setSearchText('');
    setDebouncedSearch('');
    setSearchDirFilter([]);
  }

  function closeSearch() {
    clearSearch();
    setSearchOpen(false);
  }

  function toggleSearchDir(id: string) {
    setSearchDirFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const activeDirector = directors.find(d => d.id === activeDirectorId) ?? null;
  const accentColor = activeDirector?.color ?? '#6366f1';

  const conflictDirectorNames = [...new Set(
    conflicts.flatMap(s => s.directorIds).map(id => directors.find(d => d.id === id)?.name ?? '')
  )].filter(Boolean);

  function handleAddDirector(e: React.FormEvent) {
    e.preventDefault();
    if (!newDir.firstName.trim() || !newDir.lastName.trim()) return;
    const d = addDirector(newDir.firstName, newDir.lastName, newDir.position);
    setNewDir({ firstName: '', lastName: '', position: '' });
    setAddingDirector(false);
    setActiveDirectorId(d.id);
  }

  function confirmRemoveDirector() {
    if (!removeModalId) return;
    removeDirector(removeModalId);
    if (activeDirectorId === removeModalId) setActiveDirectorId(null);
    setRemoveModalId(null);
  }

  function slotCounts(directorId: string | null) {
    const src = directorId ? slots.filter(s => s.directorIds.includes(directorId)) : slots;
    return {
      total: src.length,
      pending: src.filter(s => s.status === 'sent').length,
    };
  }

  return (
    <div className="layout">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h1 className="app-title">Diary<br />Tracker</h1>
          <p className="app-sub">Availability slots</p>
        </div>

        <nav className="director-nav">
          <button
            className={`nav-item ${activeDirectorId === null ? 'active' : ''}`}
            onClick={() => setActiveDirectorId(null)}
          >
            <span className="nav-dot" style={{ background: '#6366f1' }} />
            <span className="nav-name-block">
              <span className="nav-name">All directors</span>
            </span>
            {(() => { const c = slotCounts(null); return c.total > 0 && (
              <span className="nav-badge-group">
                <span className="nav-badge">{c.total}</span>
                {c.pending > 0 && <span className="nav-pending-dot" title={`${c.pending} awaiting response`} />}
              </span>
            ); })()}
          </button>

          <div className="nav-divider" />

          {directors.map(d => (
            <div key={d.id} className="nav-item-row">
              <button
                className={`nav-item ${activeDirectorId === d.id ? 'active' : ''}`}
                onClick={() => { setActiveDirectorId(d.id); setRemoveModalId(null); }}
              >
                <span className="nav-dot" style={{ background: d.color }} />
                <span className="nav-name-block">
                  <span className="nav-name">{d.name}</span>
                  {d.position && <span className="nav-position">{d.position}</span>}
                </span>
                {(() => { const c = slotCounts(d.id); return c.total > 0 && (
                  <span className="nav-badge-group">
                    <span className="nav-badge" style={activeDirectorId === d.id ? { background: d.color } : {}}>{c.total}</span>
                    {c.pending > 0 && <span className="nav-pending-dot" title={`${c.pending} awaiting response`} />}
                  </span>
                ); })()}
              </button>
              {activeDirectorId === d.id && (
                <button
                  className="nav-remove"
                  title="Remove director"
                  onClick={() => setRemoveModalId(d.id)}
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {addingDirector ? (
            <form onSubmit={handleAddDirector} className="add-dir-form">
              <input
                autoFocus
                type="text"
                placeholder="First name"
                value={newDir.firstName}
                onChange={e => setNewDir(d => ({ ...d, firstName: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Last name"
                value={newDir.lastName}
                onChange={e => setNewDir(d => ({ ...d, lastName: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Position (optional)"
                value={newDir.position}
                onChange={e => setNewDir(d => ({ ...d, position: e.target.value }))}
              />
              <div className="add-dir-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={() => { setAddingDirector(false); setNewDir({ firstName: '', lastName: '', position: '' }); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn-add-dir" onClick={() => setAddingDirector(true)}>
              + Add director
            </button>
          )}

          <button className="btn-restore" onClick={restoreMissingDefaults}>
            ↩ Restore removed directors
          </button>

          <button className="btn-log-slot" onClick={() => setDrawerOpen(true)}>
            + Log availability slot
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main key={activeDirectorId ?? 'all'} className="main">
        <div className="main-header">
          <div>
            <h2 className="view-title" style={{ color: accentColor }}>
              {activeDirector ? activeDirector.name : 'All Directors'}
            </h2>
            <p className="view-sub">
              {tabSlots.filter(s => s.status === 'sent').length} slot{tabSlots.filter(s => s.status === 'sent').length !== 1 ? 's' : ''} awaiting response
            </p>
          </div>
          <button
            className={`search-toggle ${searchOpen ? 'active' : ''}`}
            onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}
            title={searchOpen ? 'Close search' : 'Search slots'}
          >
            <svg className="search-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            {isSearchActive && <span className="search-toggle-dot" />}
          </button>
        </div>

        {/* ── Search panel ── */}
        {searchOpen && (
          <div className="search-section">
            <div className="search-input-row">
              <svg className="search-icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
              <input
                autoFocus
                type="text"
                className="search-input"
                placeholder="Search by meeting name or client…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              {searchText && (
                <button className="search-clear" onClick={() => { setSearchText(''); setDebouncedSearch(''); }}>×</button>
              )}
            </div>
            <div className="search-dir-filter">
              {directors.map(d => (
                <button
                  key={d.id}
                  className={`search-dir-chip ${searchDirFilter.includes(d.id) ? 'selected' : ''}`}
                  style={searchDirFilter.includes(d.id)
                    ? { background: d.color + '22', color: d.color, borderColor: d.color }
                    : {}}
                  onClick={() => toggleSearchDir(d.id)}
                >
                  <span className="chip-dot" style={{ background: d.color }} />
                  {d.name}
                </button>
              ))}
            </div>
            {isSearchActive && (
              <div className="search-active-bar">
                <span>{searchedSlots.length} result{searchedSlots.length !== 1 ? 's' : ''}</span>
                <button className="search-clear-all" onClick={clearSearch}>Clear filters ×</button>
              </div>
            )}
          </div>
        )}

        <div className="status-filter-bar">
          {(['all', 'sent', 'accepted', 'declined', 'expired'] as StatusFilter[]).map(f => (
            <button
              key={f}
              className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
              style={statusFilter === f ? { background: accentColor, borderColor: accentColor } : {}}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">
                {f === 'all' ? tabSlots.length : tabSlots.filter(s => s.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {searchedSlots.length === 0 ? (
          <div className="empty-state">
            {isSearchActive ? (
              <>
                <p>No slots match your search.</p>
                <button className="btn-log-slot-empty" onClick={clearSearch}>Clear filters</button>
              </>
            ) : (
              <>
                <p>No slots here yet.</p>
                <button className="btn-log-slot-empty" onClick={() => setDrawerOpen(true)}>
                  + Log your first slot
                </button>
              </>
            )}
          </div>
        ) : (
          searchedSlots.map(slot => (
            <SlotCard
              key={slot.id}
              slot={slot}
              directors={directors}
              overlapCount={getOverlapCount(slot)}
              onStatusChange={updateStatus}
              onRequestDelete={setDeleteSlotId}
            />
          ))
        )}
      </main>

      {/* ── Slide-out drawer ──────────────────────────── */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Log availability slot</h2>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <AddSlotForm
              directors={directors}
              onAdd={slot => { addSlot(slot); setConflicts([]); setDrawerOpen(false); }}
              conflicts={conflicts}
              conflictDirectorNames={conflictDirectorNames}
              onCheckConflicts={(date, start, end, directorIds) =>
                setConflicts(findConflicts(date, start, end, directorIds))
              }
            />
          </div>
        </div>
      )}

      {/* ── Remove director modal ─────────────────────── */}
      {removeModalId && (() => {
        const director = directors.find(d => d.id === removeModalId)!;
        const slotCount = slots.filter(s => s.directorIds.includes(removeModalId)).length;
        return (
          <ConfirmModal
            title={`Remove ${director.name}?`}
            body={<>
              This will permanently remove <strong>{director.name}</strong> from the dashboard.
              {slotCount > 0 && <> It will also remove or detach the <strong>{slotCount} slot{slotCount !== 1 ? 's' : ''}</strong> currently assigned to them.</>}
            </>}
            confirmLabel="Yes, remove"
            onConfirm={confirmRemoveDirector}
            onCancel={() => setRemoveModalId(null)}
          />
        );
      })()}

      {/* ── Delete slot modal ─────────────────────────── */}
      {deleteSlotId && (() => {
        const slot = slots.find(s => s.id === deleteSlotId)!;
        const d = new Date(slot.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        return (
          <ConfirmModal
            title="Delete this slot?"
            body={<>
              <strong>{slot.purpose}</strong> → {slot.sentTo}<br />
              <span style={{ color: '#94a3b8', fontSize: '0.9em' }}>{d} &nbsp; {slot.startTime}–{slot.endTime}</span>
              <br /><br />This cannot be undone.
            </>}
            confirmLabel="Delete slot"
            onConfirm={() => { deleteSlot(deleteSlotId); setDeleteSlotId(null); }}
            onCancel={() => setDeleteSlotId(null)}
          />
        );
      })()}
    </div>
  );
}

interface Props {
  title: string;
  body: React.ReactNode;
  icon?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, body, icon = '🗑', confirmLabel = 'Delete', confirmVariant = 'danger', onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{icon}</div>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{body}</div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className={`modal-confirm modal-confirm--${confirmVariant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

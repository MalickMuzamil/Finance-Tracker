import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  title,
  onClose,
  maxWidth = '560px',
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal"
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHead">
          <h2>{title}</h2>
          <button
            type="button"
            className="iconBtn closeBtn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

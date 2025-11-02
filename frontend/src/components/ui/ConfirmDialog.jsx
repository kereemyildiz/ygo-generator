/**
 * ConfirmDialog Component
 * Modern replacement for window.confirm()
 */

import Modal from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {Function} props.onClose - Called when dialog closes
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {string} props.title - Dialog title
 * @param {string|React.ReactNode} props.message - Dialog message
 * @param {string} props.confirmText - Confirm button text (default: "Onayla")
 * @param {string} props.cancelText - Cancel button text (default: "İptal")
 * @param {string} props.variant - Button variant: 'default', 'destructive' (default: 'default')
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'default'
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {variant === 'destructive' && (
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        )}
        <div className="flex-1">
          {typeof message === 'string' ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {message}
            </p>
          ) : (
            message
          )}
        </div>
      </div>
    </Modal>
  );
}

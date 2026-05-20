import { AlertTriangle } from 'lucide-react'

/**
 * Finestra di conferma riusabile.
 * Props:
 * - open (bool): se mostrare il dialog
 * - title (string): titolo del dialog
 * - message (string): testo del corpo
 * - confirmLabel (string): testo bottone di conferma (default "Conferma")
 * - cancelLabel (string): testo bottone annulla (default "Annulla")
 * - destructive (bool): se true il bottone di conferma è rosso (azioni distruttive)
 * - onConfirm (fn): callback al click conferma
 * - onCancel (fn): callback al click annulla / overlay
 */
export default function ConfirmDialog({
  open,
  title = 'Conferma',
  message = 'Sei sicuro di voler procedere?',
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          {destructive && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="font-poppins font-semibold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-agri-green hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
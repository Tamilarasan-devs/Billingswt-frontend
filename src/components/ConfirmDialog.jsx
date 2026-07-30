import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-slate-600 mb-8">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

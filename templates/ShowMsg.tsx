import { toast } from 'react-hot-toast';

// Generalized function to show toast messages
export function showToast(type: 'success' | 'error' | 'warning', msg: string) {
  switch (type) {
    case 'success':
      toast.success(msg, {
        duration: 5000,  // Duration in milliseconds
        position: 'top-center',  // Position of the toast
        style: {
          background: '#4caf50',  // Green for success
          color: '#fff',
        },
      });
      break;
    case 'error':
      toast.error(msg, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#f44336',  // Red for error
          color: '#fff',
        },
      });
      break;
    case 'warning':
      toast(msg, {
        duration: 5000,
        position: 'top-center',
        icon: '⚠️',  // Optional warning icon
        style: {
          background: '#ff9800',  // Orange for warning
          color: '#fff',
        },
      });
      break;
    default:
      console.error('Invalid toast type');
  }
}

// Optional, you can keep individual functions if needed
export function showSuccess(msg: string) {
  showToast('success', msg);
}

export function showError(msg: string) {
  showToast('error', msg);
}

export function showWarn(msg: string) {
  showToast('warning', msg);
}

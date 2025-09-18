import { toast } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'warning';

export function showToast(type: ToastType, msg: string) {
  switch (type) {
    case 'success':
      toast.success(msg, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#4caf50',
          color: '#fff',
        },
      });
      break;
    case 'error':
      toast.error(msg, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
      break;
    case 'warning':
      toast(msg, {
        duration: 5000,
        position: 'top-center',
        icon: '⚠️',
        style: {
          background: '#ff9800',
          color: '#fff',
        },
      });
      break;
    default:
      console.error('Invalid toast type');
  }
}

export const showSuccess = (msg: string) => showToast('success', msg);
export const showError = (msg: string) => showToast('error', msg);
export const showWarn = (msg: string) => showToast('warning', msg);

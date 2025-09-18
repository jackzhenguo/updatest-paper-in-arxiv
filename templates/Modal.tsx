// Modal.tsx
import React from 'react';
import { X } from 'lucide-react';  // Importing the X icon from lucide-react

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  children: React.ReactNode;  // Allows custom content like input fields and buttons
}

const Modal = ({ isOpen, onClose, title, onSubmit, children }: ModalProps) => {
  if (!isOpen) return null;  // Don't render modal if isOpen is false

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg w-96 shadow-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <X className="h-6 w-6 text-black" />
        </button>

        {/* Modal Content */}
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
        <div className="flex justify-end mt-4">
          <button
            onClick={onSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {title}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

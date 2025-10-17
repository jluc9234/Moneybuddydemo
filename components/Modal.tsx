import React from 'react';
import { XCircleIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className={`bg-gray-800 border border-lime-400/30 rounded-2xl shadow-2xl shadow-lime-500/10 w-full ${sizeClasses[size]} m-4 p-6 relative animate-fade-in-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-lime-300">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
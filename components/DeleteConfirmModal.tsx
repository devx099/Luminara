import React from 'react';
import type { Agent } from '../types';
import { AlertCircle } from './icons';

interface DeleteConfirmModalProps {
  agent: Agent;
  onClose: () => void;
  onConfirm: (agentId: string) => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ agent, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Delete Agent?</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action can be undone for a short period.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border-2 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:text-gray-200">
            Cancel
          </button>
          <button onClick={() => onConfirm(agent.id)} className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
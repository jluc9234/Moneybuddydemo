import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { PlaidIcon, RefreshCwIcon } from './icons';

interface ConnectAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectionSuccess: () => void; // Callback to refresh data in parent
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({ isOpen, onClose, onConnectionSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSimulatedConnection = () => {
        setIsLoading(true);
        // Simulate the time it takes to go through Plaid Link
        setTimeout(() => {
            onConnectionSuccess();
            setIsLoading(false);
            // Parent component will close the modal on success
        }, 2000);
    };

    // Reset loading state if modal is closed prematurely
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Bank Account">
            <div className="space-y-4 text-center">
                
                <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-gray-300">In a real application, this would launch the Plaid Link flow to securely connect your bank accounts.</p>
                    <p className="text-sm text-gray-400 mt-2">For this demo, clicking below will add a few pre-defined accounts to your profile.</p>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSimulatedConnection} 
                        disabled={isLoading}
                        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCwIcon className="w-5 h-5 animate-spin"/>
                                <span>Connecting...</span>
                            </>
                        ) : (
                             <>
                                <PlaidIcon className="w-6 h-6"/>
                                <span>Simulate Connection</span>
                            </>
                        )}
                    </button>
                </div>

                 <p className="text-xs text-gray-500 pt-2">
                    Using Plaid for secure bank connections.
                </p>
            </div>
        </Modal>
    );
};

export default ConnectAccountModal;

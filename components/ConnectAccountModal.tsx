import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '../supabaseClient'; 

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
}

const ConnectAccountModal = ({ isOpen, onClose, onConnectionSuccess }: ConnectAccountModalProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch the Link Token from Supabase when modal opens
  useEffect(() => {
    if (isOpen) {
      const getLinkToken = async () => {
        try {
          // Check if user is logged in first
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error("No active session found");
            return;
          }

          const { data, error } = await supabase.functions.invoke('create-link-token');
          
          if (error) throw error;
          // Handle both common casing conventions just in case
          setLinkToken(data?.linkToken || data?.link_token);
        } catch (err: any) {
          console.error('Error fetching link token:', err);
          setError('Failed to initialize bank connection.');
        }
      };
      getLinkToken();
    }
  }, [isOpen]);

  // 2. Handle Success: Exchange the public token for an access token
  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      const { error } = await supabase.functions.invoke('exchange-public-token', {
        body: { public_token, metadata }
      });

      if (error) throw error;

      onConnectionSuccess(); // Refresh the dashboard
      onClose(); // Close the modal
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      alert('Failed to connect account. See console for details.');
    }
  }, [onConnectionSuccess, onClose]);

  // 3. Configure Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/20 mb-4">
            <svg className="h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-6 9 6M8 10h10V7H8v3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Connect Your Bank</h2>
          <p className="text-sm text-gray-400 mt-2">
            Link your primary checking or savings account to securely transfer funds.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={() => open()} 
            disabled={!ready || !linkToken}
            className="w-full bg-lime-500 hover:bg-lime-400 text-purple-900 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {ready && linkToken ? "Launch Plaid Link" : "Preparing Connection..."}
          </button>
          
          <button 
            onClick={onClose} 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccountModal;

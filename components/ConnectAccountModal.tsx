import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '../supabaseClient'; 

const ConnectAccountModal = ({ isOpen, onClose, onConnectionSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Step 1: Get a link token from your Supabase Edge Function
  const getLinkToken = async () => {
    const { data, error } = await supabase.functions.invoke('create-link-token');
    if (data?.link_token) setLinkToken(data.link_token);
  };

  useEffect(() => {
    if (isOpen) getLinkToken();
  }, [isOpen]);

  // Step 2: Handle the successful bank login
  const onSuccess = useCallback(async (public_token, metadata) => {
    const { data, error } = await supabase.functions.invoke('plaid-exchange', {
      body: { public_token, metadata }
    });

    if (!error) {
      onConnectionSuccess(); // Refresh your UI
      onClose();
    }
  }, [onConnectionSuccess, onClose]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Connect Your Bank</h2>
        <p>We use Plaid to securely connect your accounts in Production.</p>
        <button 
          onClick={() => open()} 
          disabled={!ready}
          className="bg-lime-500 text-black p-3 rounded font-bold"
        >
          {ready ? "Launch Plaid Link" : "Loading..."}
        </button>
        <button onClick={onClose} className="mt-4 text-gray-400">Cancel</button>
      </div>
    </div>
  );
};

export default ConnectAccountModal;

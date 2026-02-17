import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function BalanceSummary() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  async function fetchBalances() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setAccounts(data || []);
      const totalBalance = (data || []).reduce((acc, accData) => acc + (accData.current_balance || 0), 0);
      setTotal(totalBalance);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDERING (Using YOUR Original Styles) ---
  return (
    <div className="p-4 md:p-6 bg-indigo-900/60 backdrop-blur-lg border border-indigo-400/30 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</h2>
          <p className="text-4xl font-bold text-white tracking-tight">
            ${loading ? '...' : total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="h-12 w-12 bg-lime-400/20 rounded-full flex items-center justify-center border border-lime-400/50">
          <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <p className="text-indigo-300 italic">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-indigo-300 italic">No accounts connected yet.</p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="flex justify-between items-center py-2 border-b border-indigo-500/30 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-800/50 flex items-center justify-center text-indigo-200 font-bold text-xs border border-indigo-500/30">
                  {acc.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{acc.name}</p>
                  <p className="text-xs text-indigo-300">****{acc.mask}</p>
                </div>
              </div>
              <p className="text-lime-300 font-bold text-sm">${(acc.current_balance || 0).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

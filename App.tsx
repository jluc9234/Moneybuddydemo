import React, { useState, useEffect, useCallback } from 'react';
import { Account, Transaction, LockedSaving, TransactionStatus, GeoFence, TimeRestriction, User } from './types';
import { EARLY_WITHDRAWAL_PENALTY_RATE } from './constants';
import Header from './components/Header';
import BalanceSummary from './components/BalanceSummary';
import SendMoney from './components/SendMoney';
import LockedSavings from './components/LockedSavings';
import TransactionHistory from './components/TransactionHistory';
import Modal from './components/Modal';
import ProfileSettings from './components/ProfileSettings';
import SecurityTip from './components/SecurityTip';
import ConnectAccountModal from './components/ConnectAccountModal';
import NotificationsPanel from './components/NotificationsPanel';
import RequestMoney from './components/RequestMoney';
import TransactionDetailModal from './components/TransactionDetailModal';
import Auth from './components/Auth';
import DeveloperSettings from './components/DeveloperSettings';

type ActiveTab = 'send' | 'lock' | 'history' | 'request';
type AppUser = { id: string; email: string; name: string; };

const TRANSACTION_FEE_RATE = 0.03; // 3%

const MOCK_USER: AppUser = {
    id: 'mock-user-123',
    email: 'demo@moneybuddy.app',
    name: 'Demo User'
};

const getInitialState = () => {
    const defaultAccounts: Account[] = [
        { id: 'acc-1', name: 'Primary Checking', provider: 'Chase', type: 'checking', balance: 5420.50, logo: undefined },
        { id: 'acc-2', name: 'High-Yield Savings', provider: 'Bank of America', type: 'savings', balance: 12500.00, logo: undefined },
    ];
    const defaultTransactions: Transaction[] = [
        { id: 'tx-1', type: 'receive', amount: 250, from_details: 'jane.doe@example.com', to_details: MOCK_USER.email, date: new Date(Date.now() - 86400000), status: TransactionStatus.COMPLETED, description: 'Payment for concert tickets' },
        { id: 'tx-2', type: 'send', amount: 45.50, from_details: MOCK_USER.email, to_details: 'pizzapalace@example.com', date: new Date(Date.now() - 172800000), status: TransactionStatus.COMPLETED, description: 'Dinner with friends', fee: 1.37 },
        { id: 'tx-3', type: 'request', amount: 20.00, from_details: 'bob.smith@example.com', to_details: MOCK_USER.email, date: new Date(), status: TransactionStatus.PENDING, description: 'Coffee run' },
        { id: 'tx-4', type: 'send', amount: 100.00, from_details: MOCK_USER.email, to_details: 'moviebuff@example.com', date: new Date(), status: TransactionStatus.PENDING, description: 'Movie night', geoFence: { latitude: 34.0522, longitude: -118.2437, radiusKm: 2, locationName: 'Downtown Los Angeles' } },
    ];
    const defaultSavings: LockedSaving[] = [
        { id: 'ls-1', accountId: 'acc-2', amount: 5000, lockPeriodMonths: 6, startDate: new Date(Date.now() - 80 * 86400000), endDate: new Date(Date.now() + 100 * 86400000), status: 'Locked' },
    ];
    return { defaultAccounts, defaultTransactions, defaultSavings };
};


const App: React.FC = () => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [lockedSavings, setLockedSavings] = useState<LockedSaving[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('send');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isConnectAccountModalOpen, setIsConnectAccountModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [accountToRemove, setAccountToRemove] = useState<Account | null>(null);
    const [isClaiming, setIsClaiming] = useState<string | null>(null);

    const handleLogin = () => {
        const { defaultAccounts, defaultTransactions, defaultSavings } = getInitialState();
        setUser(MOCK_USER);
        setAccounts(defaultAccounts);
        setTransactions(defaultTransactions);
        setLockedSavings(defaultSavings);
    };
    
    const handleLogout = () => {
        setUser(null);
        setAccounts([]);
        setTransactions([]);
        setLockedSavings([]);
    };

    const handleSendMoney = async (fromAccountId: string, to: string, amount: number, description: string, geoFence: GeoFence | undefined, timeRestriction: TimeRestriction | undefined) => {
        if (!user) return;
        const fromAccount = accounts.find(acc => acc.id === fromAccountId);
        if (!fromAccount) { alert("Invalid source account."); return; }
        
        const fee = amount * TRANSACTION_FEE_RATE;
        const totalDebit = amount + fee;
        const hasRestrictions = !!geoFence || !!timeRestriction;

        if (fromAccount.balance === null || fromAccount.balance < totalDebit) {
            alert("Insufficient funds to cover the amount and transaction fee.");
            return;
        }

        // Debit sender
        setAccounts(prev => prev.map(acc => acc.id === fromAccountId ? { ...acc, balance: acc.balance! - totalDebit } : acc));

        // Create new transaction
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'send',
            amount: amount,
            from_details: user.email,
            to_details: to,
            date: new Date(),
            status: hasRestrictions ? TransactionStatus.PENDING : TransactionStatus.COMPLETED,
            geoFence,
            timeRestriction,
            description,
            fee
        };
        setTransactions(prev => [newTransaction, ...prev]);

        if (!hasRestrictions) {
            // If it's a direct payment, we can simulate the recipient getting it instantly.
            // In a real app, this would be a separate record for the other user.
            const receiveTransaction: Transaction = {
                 id: crypto.randomUUID(),
                 type: 'receive',
                 amount,
                 from_details: user.email,
                 to_details: to,
                 date: new Date(),
                 status: TransactionStatus.COMPLETED,
                 description
            };
            // For demo, we don't add this to our own history.
        }
        
        setActiveTab('history');
        alert(hasRestrictions ? 'Conditional payment sent!' : 'Payment sent successfully!');
    };
    
    const handleClaimTransaction = async (tx: Transaction) => {
        setIsClaiming(tx.id);
        
        // Simulate checking conditions
        setTimeout(() => {
            let canClaim = true;
            let reason = "";

            if (tx.timeRestriction && new Date() > new Date(tx.timeRestriction.expiresAt)) {
                canClaim = false;
                reason = "This transaction has expired.";
            }
            
            // For demo purposes, we will assume the user is within the geofence.
            // A full implementation would use navigator.geolocation here.

            if (canClaim) {
                const targetAccount = accounts[0]; // Credit the first account
                 setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: TransactionStatus.COMPLETED } : t));
                 setAccounts(prev => prev.map(acc => acc.id === targetAccount.id ? { ...acc, balance: acc.balance! + tx.amount } : acc));
                 alert('Transaction claimed successfully!');
            } else {
                 setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: TransactionStatus.FAILED } : t));
                 // In a real app, funds would be returned to sender.
                 alert(`Claim failed: ${reason}`);
            }
            
            setIsClaiming(null);
        }, 1500);
    };

    const handleRequestMoney = async (to: string, amount: number, description: string) => {
        if (!user) return;
        const newRequest: Transaction = {
            id: crypto.randomUUID(),
            type: 'request',
            amount: amount,
            from_details: user.email, // I am requesting
            to_details: to, // from this person
            date: new Date(),
            status: TransactionStatus.PENDING,
            description,
        };
        setTransactions(prev => [newRequest, ...prev]);
        setActiveTab('history');
        alert('Request sent!');
    };

    const handleLock = async (accountId: string, amount: number, period: number) => {
        if (!user) return;
        const fromAccount = accounts.find(acc => acc.id === accountId);
        if (!fromAccount || fromAccount.balance === null || fromAccount.balance < amount) {
            alert('Insufficient funds to lock.');
            return;
        }

        setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: acc.balance! - amount } : acc));
        
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + period);

        const newSaving: LockedSaving = {
            id: crypto.randomUUID(),
            accountId,
            amount,
            lockPeriodMonths: period,
            startDate,
            endDate,
            status: 'Locked',
        };
        setLockedSavings(prev => [newSaving, ...prev]);

        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'lock',
            amount,
            from_details: user.email,
            to_details: 'Locked Savings Vault',
            date: new Date(),
            status: TransactionStatus.LOCKED,
            description: `Locked ${amount} for ${period} months`
        };
        setTransactions(prev => [newTransaction, ...prev]);
        setActiveTab('lock');
        alert('Funds locked successfully!');
    };
    
    const handleWithdraw = async (saving: LockedSaving) => {
        if (!user) return;
        const isEarly = new Date() < new Date(saving.endDate);
        if (isEarly) {
            if (!confirm("This is an early withdrawal, and a 5% penalty will be applied. Are you sure?")) return;
        }

        const penalty = isEarly ? saving.amount * EARLY_WITHDRAWAL_PENALTY_RATE : 0;
        const amountToReturn = saving.amount - penalty;
        const targetAccount = accounts.find(acc => acc.id === saving.accountId) || accounts[0];

        // Update saving status
        setLockedSavings(prev => prev.map(s => s.id === saving.id ? { ...s, status: 'Withdrawn' } : s));

        // Return funds to account
        setAccounts(prev => prev.map(acc => acc.id === targetAccount.id ? { ...acc, balance: acc.balance! + amountToReturn } : acc));

        // Create transaction for returned funds
        const returnTx: Transaction = {
            id: crypto.randomUUID(),
            type: 'receive',
            amount: amountToReturn,
            from_details: 'Locked Savings Vault',
            to_details: user.email,
            date: new Date(),
            status: TransactionStatus.COMPLETED,
            description: `Withdrawal from locked savings`
        };
        setTransactions(prev => [returnTx, ...prev]);

        // Create transaction for penalty if applicable
        if (penalty > 0) {
            const penaltyTx: Transaction = {
                 id: crypto.randomUUID(),
                 type: 'penalty',
                 amount: penalty,
                 from_details: user.email,
                 to_details: 'System Penalty',
                 date: new Date(),
                 status: TransactionStatus.COMPLETED,
                 description: `Early withdrawal penalty`
            };
            setTransactions(prev => [penaltyTx, ...prev]);
        }
        alert('Withdrawal successful!');
    };
    
    const handleApproveRequest = async (tx: Transaction) => {
        const fromAccount = accounts[0];
        if (!fromAccount || fromAccount.balance === null || fromAccount.balance < tx.amount) {
            alert("Insufficient funds to approve this request.");
            return;
        }

        // Debit my account
        setAccounts(prev => prev.map(acc => acc.id === fromAccount.id ? { ...acc, balance: acc.balance! - tx.amount } : acc));

        // Mark original request as completed
        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: TransactionStatus.COMPLETED } : t));

        // Create my 'send' transaction
        const sendTx: Transaction = {
             id: crypto.randomUUID(),
             type: 'send',
             amount: tx.amount,
             from_details: user!.email,
             to_details: tx.from_details,
             date: new Date(),
             status: TransactionStatus.COMPLETED,
             description: `Payment for request: ${tx.description}`
        };
        setTransactions(prev => [sendTx, ...prev]);
    };

    const handleDeclineRequest = async (tx: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: TransactionStatus.DECLINED } : t));
    };

    const handleConnectionSuccess = async () => {
        const newAccounts: Account[] = [
            { id: crypto.randomUUID(), name: 'Simulated Visa Card', provider: 'Stripe', type: 'credit', balance: 150.32 },
            { id: crypto.randomUUID(), name: 'PayPal Balance', provider: 'PayPal', type: 'digital', balance: 305.11 },
        ];
        setAccounts(prev => [...prev, ...newAccounts]);
        setIsConnectAccountModalOpen(false);
    };

    const handleRemoveAccount = async () => {
        if (!accountToRemove) return;

        const hasActiveSavings = lockedSavings.some(s => s.accountId === accountToRemove.id && s.status !== 'Withdrawn');
        if (hasActiveSavings) {
            alert(`Cannot remove "${accountToRemove.name}". Active locked savings are associated with it.`);
            setAccountToRemove(null);
            return;
        }
        
        setAccounts(prev => prev.filter(acc => acc.id !== accountToRemove.id));
        setAccountToRemove(null);
    };

    const notificationCount = transactions.filter(tx => (tx.type === 'request' && tx.to_details === user?.email && tx.status === TransactionStatus.PENDING)).length
        + lockedSavings.filter(s => s.status === 'Locked' && new Date() > new Date(s.endDate)).length;

    if (!user) {
        return <Auth onLogin={handleLogin} />;
    }

    const tabStyle = "px-4 py-3 font-bold rounded-lg transition-all duration-300 w-full text-center";
    const activeTabStyle = "bg-lime-500 text-indigo-900 shadow-lg shadow-lime-500/20";
    const inactiveTabStyle = "bg-gray-700/50 hover:bg-gray-600 text-white";

    return (
        <div className="relative min-h-screen z-10 shadow-[inset_0_0_8rem_rgba(126,34,206,0.2)]">
            <Header 
                onProfileClick={() => setIsProfileModalOpen(true)}
                notificationCount={notificationCount}
                onBellClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            />
            {isNotificationsOpen && user?.email && (
                <NotificationsPanel 
                    transactions={transactions}
                    lockedSavings={lockedSavings}
                    currentUserEmail={user.email}
                    onApproveRequest={handleApproveRequest}
                    onDeclineRequest={handleDeclineRequest}
                    onWithdraw={handleWithdraw}
                    onClose={() => setIsNotificationsOpen(false)}
                />
            )}
            <main className="p-4 md:p-8 space-y-8">
                <BalanceSummary 
                    accounts={accounts} 
                    onConnectClick={() => setIsConnectAccountModalOpen(true)}
                    onRemoveAccount={(accountId: string) => {
                        const acc = accounts.find(a => a.id === accountId);
                        if (acc) setAccountToRemove(acc);
                    }}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-2 bg-black/20 rounded-xl">
                    <button onClick={() => setActiveTab('send')} className={`${tabStyle} ${activeTab === 'send' ? activeTabStyle : inactiveTabStyle}`}>Send</button>
                    <button onClick={() => setActiveTab('request')} className={`${tabStyle} ${activeTab === 'request' ? activeTabStyle : inactiveTabStyle}`}>Request</button>
                    <button onClick={() => setActiveTab('lock')} className={`${tabStyle} ${activeTab === 'lock' ? activeTabStyle : inactiveTabStyle}`}>Lock</button>
                    <button onClick={() => setActiveTab('history')} className={`${tabStyle} ${activeTab === 'history' ? activeTabStyle : inactiveTabStyle}`}>History</button>
                </div>

                <div className="animate-fade-in-up">
                    {activeTab === 'send' && <SendMoney accounts={accounts} onSend={handleSendMoney} />}
                    {activeTab === 'request' && <RequestMoney onRequest={handleRequestMoney} />}
                    {activeTab === 'lock' && <LockedSavings accounts={accounts} lockedSavings={lockedSavings} onLock={handleLock} onWithdraw={handleWithdraw} />}
                    {activeTab === 'history' && user?.email && (
                        <TransactionHistory 
                            transactions={transactions} 
                            currentUserEmail={user.email}
                            onTransactionClick={setSelectedTransaction}
                            onApproveRequest={handleApproveRequest}
                            onDeclineRequest={handleDeclineRequest}
                            onClaimTransaction={handleClaimTransaction}
                            isClaimingId={isClaiming}
                        />
                    )}
                </div>

                <SecurityTip />
            </main>
            
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Profile & Settings">
                 <ProfileSettings 
                    user={{ name: user.name, email: user.email }}
                    onLogout={handleLogout}
                 />
            </Modal>

            <ConnectAccountModal 
                isOpen={isConnectAccountModalOpen} 
                onClose={() => setIsConnectAccountModalOpen(false)} 
                onConnectionSuccess={handleConnectionSuccess}
            />

            <TransactionDetailModal
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />

             <Modal isOpen={!!accountToRemove} onClose={() => setAccountToRemove(null)} title="Confirm Account Removal">
                {accountToRemove && (
                    <div className="text-white space-y-4">
                        <p>Are you sure you want to remove the account <strong className="font-bold text-lime-300">{accountToRemove.name}</strong>?</p>
                        <p className="text-sm text-yellow-300 bg-yellow-900/30 p-3 rounded-lg">This action is irreversible. All active locked savings associated with this account must be withdrawn first.</p>
                        <div className="flex justify-end space-x-4 pt-4">
                            <button onClick={() => setAccountToRemove(null)} className="font-bold py-2 px-4 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500">
                                Cancel
                            </button>
                            <button onClick={handleRemoveAccount} className="font-bold py-2 px-4 rounded-lg transition-colors bg-red-600 hover:bg-red-500">
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default App;

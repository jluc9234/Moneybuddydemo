import React, { useState, useEffect } from 'react';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-900 rounded-md p-3 text-sm text-lime-300 font-mono overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const ExternalLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300 underline font-semibold">
        {children}
    </a>
);

const CodeAccordion: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-gray-900/70 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-3 flex justify-between items-center"
            >
                <div>
                    <p className="font-semibold text-lime-300">{title}</p>
                    <p className="text-xs text-gray-400 mt-1">{description}</p>
                </div>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'text-gray-500'}`}>{isOpen ? '▼' : '▶'}</span>
            </button>
            {isOpen && <div className="p-2 border-t border-lime-500/20">{children}</div>}
        </div>
    );
};

// The full SQL script is embedded here for easy access within the guide.
const sqlScript = `-- Money Buddy Supabase Setup Script
-- This script sets up the required tables, types, and policies for the app.
-- Run this entire script in your Supabase SQL Editor.

-- 1. Create custom types for better data integrity
CREATE TYPE public.transaction_status AS ENUM (
    'Pending',
    'Completed',
    'Failed',
    'Returned',
    'Locked',
    'Declined'
);

CREATE TYPE public.transaction_type AS ENUM (
    'send',
    'receive',
    'lock',
    'penalty',
    'request',
    'fee'
);

CREATE TYPE public.saving_status AS ENUM (
    'Pending',
    'Locked',
    'Withdrawn',
    'Failed'
);

-- 2. Create the users table to store public profile information
-- This table will be linked to the auth.users table.
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    email character varying UNIQUE
);

-- 3. Set up Row Level Security (RLS) for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Users can see their own profile
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT
USING (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 4. Create a function to automatically insert a new user into the public.users table upon sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a trigger to call the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Create the accounts table
CREATE TABLE public.accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    provider character varying NOT NULL,
    type character varying,
    balance numeric(10, 2),
    logo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. Set up RLS for the accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own accounts" ON public.accounts FOR ALL
USING (auth.uid() = user_id);

-- 8. Create the transactions table
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for system transactions
    from_details text NOT NULL,
    to_details text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    fee numeric(10, 2) DEFAULT 0.00,
    description text,
    type public.transaction_type NOT NULL,
    status public.transaction_status NOT NULL,
    geo_fence jsonb,
    time_restriction jsonb,
    paypal_order_id text UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 9. Set up RLS for the transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
        AND (public.users.email = public.transactions.from_details OR public.users.email = public.transactions.to_details)
    )
);
-- Allow users to insert transactions where they are the sender
CREATE POLICY "Users can create transactions from their own email" ON public.transactions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid() AND public.users.email = public.transactions.from_details
    )
);
-- Allow users to update the status of transactions sent TO them (e.g., declining a request)
CREATE POLICY "Users can update status on transactions sent to them" ON public.transactions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid() AND public.users.email = public.transactions.to_details
    )
);


-- 10. Create the locked_savings table
CREATE TABLE public.locked_savings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    amount numeric(10, 2) NOT NULL,
    lock_period_months integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status public.saving_status NOT NULL,
    paypal_order_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 11. Set up RLS for the locked_savings table
ALTER TABLE public.locked_savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own locked savings" ON public.locked_savings FOR ALL
USING (auth.uid() = user_id);

-- 12. Seed an initial account for the admin user (optional, but helpful for testing)
-- NOTE: You must replace 'lucasnale305@gmail.com' with the email of the user
-- you designated as ADMIN_EMAIL in the App.tsx file.
-- This part is best run manually after the admin user has signed up.
/*
INSERT INTO public.accounts (user_id, name, provider, type, balance)
SELECT id, 'Admin Fee Account', 'System', 'checking', 0.00
FROM auth.users
WHERE email = 'lucasnale305@gmail.com';
*/

-- End of script
`;

const SUPABASE_URL = "https://thdmywgjbhdtgtqnqizn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZG15d2dqYmhkdGd0cW5xaXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzY5ODYsImV4cCI6MjA2OTMxMjk4Nn0.CLUC8eFtRQBHz6-570NJWZ8QIZs3ty0QGuDmEF5eeFc";


interface DeveloperSettingsProps {
    currentUserEmail: string;
}

const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({ currentUserEmail }) => {
    const [config, setConfig] = useState({
        paypalClientId: '',
        paypalClientSecret: '',
        paypalApiUrl: 'https://api-m.sandbox.paypal.com',
        paypalWebhookId: '',
        paypalAdminEmail: currentUserEmail,
        supabaseServiceRoleKey: '',
        adminEmail: currentUserEmail,
        plaidClientId: '',
        plaidSecret: '',
        plaidEnv: 'sandbox',
        geminiApiKey: ''
    });
    const [showSecrets, setShowSecrets] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [copySqlStatus, setCopySqlStatus] = useState('Copy Script');

    useEffect(() => {
        const savedConfig = localStorage.getItem('moneyBuddyDevConfig');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            setConfig(prev => ({
                ...prev, 
                ...parsed, 
                paypalAdminEmail: parsed.paypalAdminEmail || currentUserEmail,
                adminEmail: parsed.adminEmail || currentUserEmail
            }));
        } else {
            setConfig(prev => ({ ...prev, paypalAdminEmail: currentUserEmail, adminEmail: currentUserEmail }));
        }
    }, [currentUserEmail]);

    const handleSaveConfig = () => {
        setSaveStatus('saving');
        localStorage.setItem('moneyBuddyDevConfig', JSON.stringify(config));
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };
    
    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopySqlStatus('Copied!');
        setTimeout(() => setCopySqlStatus('Copy Script'), 2000);
    };

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
    };
    
    const InputField = ({ name, label, value, note }: { name: keyof typeof config; label: string; value: string; note?: string }) => {
        const isSecret = String(name).toLowerCase().includes('secret') || String(name).toLowerCase().includes('key');
        return (
            <div>
                <label htmlFor={String(name)} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                <div className="relative flex items-center">
                    <input
                        type={isSecret && !showSecrets ? 'password' : 'text'}
                        id={String(name)}
                        name={String(name)}
                        value={value}
                        onChange={(e) => setConfig({ ...config, [name]: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 font-mono text-lime-300 focus:ring-lime-400 focus:border-lime-400 transition pr-10"
                    />
                    <button 
                        onClick={() => handleCopy(value)}
                        className="absolute right-2 p-1 text-gray-400 hover:text-white"
                        title="Copy"
                        type="button"
                        >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 2A1.5 1.5 0 0 1 .5 3.5V12h6V3.5A1.5 1.5 0 0 1 8 2H-1z"/></svg>
                    </button>
                </div>
                 {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
            </div>
        );
    };
    
    return (
        <div className="space-y-6 text-gray-300 max-h-[70vh] overflow-y-auto pr-2">
            
            <section>
                <h3 className="text-xl font-bold text-white mb-3">Backend Setup Guide</h3>
                <p>This application requires several external services to function correctly. Follow these steps to configure your backend on <ExternalLink href="https://supabase.com/">Supabase</ExternalLink>.</p>
            </section>
            
            <section>
                <h3 className="text-xl font-bold text-white mb-3">Step 0: Prerequisites & Frontend Connection</h3>
                 <p className="mb-3">
                    This frontend application is pre-configured to connect to a specific Supabase project to make getting started easier. The connection details are hardcoded in the file <code>services/supabase.ts</code>.
                </p>
                 <div className="space-y-2 p-3 bg-gray-900/50 rounded-lg border border-white/10 text-sm font-mono">
                    <p>SUPABASE_URL: "{SUPABASE_URL}"</p>
                    <p>SUPABASE_ANON_KEY: "{SUPABASE_ANON_KEY.substring(0, 20)}..."</p>
                </div>
                 <p className="text-xs text-gray-400 mt-2">
                    For a production application, you would replace these values with your own Supabase project's credentials.
                </p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-3">Step 1: Set Backend Environment Variables</h3>
                <p className="mb-3">Gather your API keys and add them as Secrets in your Supabase project dashboard under `Project Settings` &gt; `Secrets`. The backend functions rely on these to communicate with other services.</p>
                 <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm">
                    <strong>Disclaimer:</strong> Saving API keys here only stores them in your browser's local storage for convenience. You must <strong className="font-bold">manually</strong> set these values in your Supabase project for the backend to work.
                </div>
                <div className="space-y-4 p-4 mt-4 bg-gray-900/50 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-white">Configuration Values</h4>
                        <label className="flex items-center space-x-2 cursor-pointer text-sm">
                            <input type="checkbox" checked={showSecrets} onChange={() => setShowSecrets(!showSecrets)} className="form-checkbox h-4 w-4 rounded bg-gray-700 text-lime-500 focus:ring-lime-500 border-gray-600"/>
                            <span>Show Secrets</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="paypalClientId" label="PAYPAL_CLIENT_ID" value={config.paypalClientId} />
                        <InputField name="paypalClientSecret" label="PAYPAL_CLIENT_SECRET" value={config.paypalClientSecret} />
                        <InputField name="paypalApiUrl" label="PAYPAL_API_URL" value={config.paypalApiUrl} note="Use sandbox URL for testing."/>
                        <InputField name="paypalWebhookId" label="PAYPAL_WEBHOOK_ID" value={config.paypalWebhookId} />
                        <InputField name="paypalAdminEmail" label="PAYPAL_ADMIN_EMAIL" value={config.paypalAdminEmail} note="This is where fees and locked funds are sent."/>
                        
                        <InputField name="supabaseServiceRoleKey" label="SUPABASE_SERVICE_ROLE_KEY" value={config.supabaseServiceRoleKey} note="Found in your Supabase project's API settings. Crucial for functions that need to bypass RLS."/>
                        <InputField name="adminEmail" label="ADMIN_EMAIL" value={config.adminEmail} note="Used for internal transaction tracking."/>

                        <InputField name="plaidClientId" label="PLAID_CLIENT_ID" value={config.plaidClientId} />
                        <InputField name="plaidSecret" label="PLAID_SECRET" value={config.plaidSecret} />
                        <InputField name="plaidEnv" label="PLAID_ENV" value={config.plaidEnv} note="'sandbox', 'development', or 'production'"/>

                        <InputField name="geminiApiKey" label="API_KEY (for Gemini)" value={config.geminiApiKey} />
                    </div>

                    <div className="pt-2 text-right">
                        <button 
                            onClick={handleSaveConfig}
                            className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                        >
                            {saveStatus === 'idle' && 'Save to Browser'}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'saved' && 'Saved!'}
                        </button>
                    </div>
                </div>
            </section>
            
            <section className="pt-4">
                 <h3 className="text-xl font-bold text-white mb-3">Step 2: Database Schema Setup</h3>
                <p className="mb-3">Once your project is ready, you need to set up the database schema. This includes creating tables, types, and security policies. The following SQL script contains everything you need.</p>
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleCopySql}
                        className="w-full text-center p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                    >
                        {copySqlStatus}
                    </button>
                    <CodeAccordion title="View SQL Script" description="Click to expand the full SQL for setting up your database.">
                        <CodeBlock>{sqlScript}</CodeBlock>
                    </CodeAccordion>
                </div>
            </section>
        </div>
    )
}

export default DeveloperSettings;

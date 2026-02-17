import React from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient'; // Verify this path matches your project structure

interface ProfileSettingsProps {
    user: User;
    onLogout: () => void;
}

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newEmail = formData.get('email') as string;
    const newName = formData.get('name') as string;

    try {
      // 1. Update Authentication (Login Email)
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;

      // 2. Update Profile Data (Database)
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ full_name: newName, email: newEmail })
        .eq('id', user.id);

      if (dbError) throw dbError;

      alert('Success! Check your new email for a confirmation link.');
      if (onLogout) onLogout(); // Force logout to refresh session
      
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

    return (
        <div className="space-y-6 text-white">
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center font-bold text-2xl text-purple-900">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-gray-400">{user.email}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={user.name}
                        autoComplete="name"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-lime-400 focus:border-lime-400 transition"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={user.email}
                        autoComplete="email"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-lime-400 focus:border-lime-400 transition disabled:opacity-70"
                    />
                </div>
                <div className="pt-4 flex justify-between items-center">
                     <button 
                        type="button" 
                        onClick={onLogout}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                     >
                        Sign Out
                    </button>
                     <button type="submit" className="bg-lime-500 hover:bg-lime-400 text-purple-900 font-bold py-2 px-6 rounded-lg transition-colors">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;

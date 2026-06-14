import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import { Button } from '../../components/ui/Button';

export const MembersTab = () => {
  const { group, id, refreshGroup } = useOutletContext<any>();
  const [newUserId, setNewUserId] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const activeMembers = group.memberships.filter((m: any) => !m.left_at);
  const pastMembers = group.memberships.filter((m: any) => m.left_at);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/api/groups/${id}/members`, {
        method: 'POST',
        body: { userId: parseInt(newUserId), joined_at: joinedAt }
      });
      setNewUserId('');
      setJoinedAt('');
      refreshGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member? This does not touch past expenses.')) return;
    try {
      await api(`/api/groups/${id}/members/${userId}`, {
        method: 'PATCH'
      });
      refreshGroup();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">Current Members</h2>
        <ul className="divide-y divide-gray-200 border rounded-md">
          {activeMembers.map((m: any) => (
            <li key={m.id} className="p-4 flex justify-between items-center bg-white">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                <p className="text-sm text-gray-500">Joined: {new Date(m.joined_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleRemoveMember(m.user_id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium cursor-pointer"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {pastMembers.length > 0 && (
        <div>
          <h2 className="text-xl font-medium text-gray-900 mb-4">Past Members</h2>
          <ul className="divide-y divide-gray-200 border rounded-md opacity-75">
            {pastMembers.map((m: any) => (
              <li key={m.id} className="p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                <p className="text-sm text-gray-500">
                  Joined: {new Date(m.joined_at).toLocaleDateString()} - Left: {new Date(m.left_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Member</h3>
        <form onSubmit={handleAddMember} className="flex gap-4 items-end relative">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
                setShowDropdown(true);
              }}
              placeholder="Name or email..."
              className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
                {searchResults.map(u => (
                  <li 
                    key={u.id} 
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                    onClick={() => {
                      setNewUserId(u.id.toString());
                      setSearchQuery(u.name);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joined At</label>
            <input
              type="date"
              required
              value={joinedAt}
              onChange={e => setJoinedAt(e.target.value)}
              className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
          <Button type="submit" variant="primary" className="mb-[2px]" disabled={!newUserId}>
            Add
          </Button>
        </form>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
};

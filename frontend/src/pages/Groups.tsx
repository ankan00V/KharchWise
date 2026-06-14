import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface GroupMembership {
  id: number;
  name: string;
  membership: {
    joined_at: string;
    left_at: string | null;
  };
}

export const Groups = () => {
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await api('/api/groups');
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setCreating(true);
    try {
      await api('/api/groups', {
        method: 'POST',
        body: { name: newGroupName }
      });
      setShowCreateModal(false);
      setNewGroupName('');
      fetchGroups(); // Refresh groups list
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500">
        Loading groups...
      </div>
    );
  }

  const activeGroups = groups.filter(g => !g.membership.left_at);
  const pastGroups = groups.filter(g => g.membership.left_at);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Your Groups</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Start a new group
        </Button>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Active Groups
          </h2>
          {activeGroups.length === 0 ? (
            <Card className="text-center text-gray-500">
              You don't belong to any active groups.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeGroups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="block focus:outline-none"
                >
                  <Card padding="md" className="h-full hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Joined {new Date(group.membership.joined_at).toLocaleDateString()}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {pastGroups.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-4">
              Past Groups
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
              {pastGroups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="block focus:outline-none"
                >
                  <Card padding="md" className="h-full bg-gray-50 hover:bg-white transition-colors">
                    <h3 className="text-md font-bold text-gray-700">{group.name}</h3>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <span className="block">Joined {new Date(group.membership.joined_at).toLocaleDateString()}</span>
                      <span className="block text-orange-600">Left {new Date(group.membership.left_at!).toLocaleDateString()}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create a new group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-[#5bc5a7] focus:border-[#5bc5a7]"
                    placeholder="e.g. Goa Trip, Flat 3B"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

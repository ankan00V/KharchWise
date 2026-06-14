import { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';

export const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<any>(null);

  const fetchGroup = async () => {
    try {
      const data = await api(`/api/groups/${id}`);
      setGroup(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) fetchGroup();
  }, [id]);

  if (!group) return <div className="p-8 flex justify-center text-gray-500">Loading group...</div>;

  const tabs = [
    { name: 'Expenses', path: 'expenses' },
    { name: 'Balances', path: 'balances' },
    { name: 'Members', path: 'members' },
    { name: 'Import Data', path: 'import' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {group.name}
        </h1>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-[#5bc5a7] text-[#5bc5a7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div>
        <Outlet context={{ group, id, refreshGroup: fetchGroup }} />
      </div>
    </div>
  );
};

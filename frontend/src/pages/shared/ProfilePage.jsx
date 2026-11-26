import { LogOut, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { RoleBadge } from '../../components/common/Badges';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/formatters';

export function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  return (
    <AppLayout
      title="Account Profile"
      breadcrumbs={[
        { label: 'Dashboard', to: dashboardPath },
        { label: 'Profile' },
      ]}
    >
      <div className="max-w-2xl bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xl flex items-center justify-center">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
                <RoleBadge role={user?.role} />
              </div>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 self-start sm:self-center"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div className="flex items-start gap-3">
            <UserIcon className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Full Name</p>
              <p className="mt-0.5 font-medium text-slate-900">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">
                Email Address
              </p>
              <p className="mt-0.5 font-medium text-slate-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">
                Access Role & Status
              </p>
              <p className="mt-0.5 font-medium text-slate-900 capitalize">
                {user?.role} ({user?.isActive ? 'Active' : 'Inactive'})
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Member Since
            </p>
            <p className="mt-0.5 font-medium text-slate-900">
              {formatDateTime(user?.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

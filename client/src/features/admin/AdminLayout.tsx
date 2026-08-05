import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 lg:pl-64">
        <div className="container py-6 px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

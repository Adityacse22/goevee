import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useStations } from '@/controllers/useStations';

const AdminDashboard = () => {
  const { data: stations = [] } = useStations();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        <h1 className="mb-6 text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <p className="text-sm text-white/50">Stations</p>
            <p className="mt-2 text-3xl font-bold text-white">{stations.length}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-white/50">API</p>
            <p className="mt-2 text-lg font-semibold text-white">REST v1</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-white/50">Access</p>
            <p className="mt-2 text-lg font-semibold text-white">ADMIN</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

import { useNavigate, useParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useStation } from '@/controllers/useStations';

const StationDetails = () => {
  const { stationId = '' } = useParams();
  const navigate = useNavigate();
  const { data: station, isLoading, error } = useStation(stationId);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        {isLoading && <p className="text-white/70">Loading station...</p>}
        {error && <p className="text-red-400">Could not load station.</p>}
        {station && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">{station.name}</h1>
              <p className="mt-2 text-white/60">{station.address}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="glass-card p-4">
                <p className="text-sm text-white/50">Status</p>
                <p className="mt-1 font-semibold text-white">
                  {station.available ? 'Available' : 'Unavailable'}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-white/50">Pricing</p>
                <p className="mt-1 font-semibold text-white">₹{station.price_per_kwh}/kWh</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-white/50">Chargers</p>
                <p className="mt-1 font-semibold text-white">{station.connectors.length}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">Chargers</h2>
              {station.connectors.map((connector) => (
                <div key={connector.id} className="glass-card flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-ev-blue" />
                    <div>
                      <p className="font-medium text-white">{connector.connector_type}</p>
                      <p className="text-sm text-white/50">{connector.power_output}kW</p>
                    </div>
                  </div>
                  <span className={connector.available ? 'text-green-400' : 'text-red-400'}>
                    {connector.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              ))}
            </div>

            <Button onClick={() => navigate('/booking')} className="bg-ev-blue text-white">
              Book Charging
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StationDetails;

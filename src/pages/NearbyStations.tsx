import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StationList from '@/components/stations/StationList';

const NearbyStations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Nearby Stations</h1>
        </div>
        <StationList
          onStationSelect={(stationId) => navigate(`/stations/${stationId}`)}
        />
      </main>
      <Footer />
    </div>
  );
};

export default NearbyStations;

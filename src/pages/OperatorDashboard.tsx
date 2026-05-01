import { useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCharger, createStation } from '@/services/stationService';

const OperatorDashboard = () => {
  const [stationId, setStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [chargerCode, setChargerCode] = useState('');
  const [connectorType, setConnectorType] = useState('');
  const [powerOutputKw, setPowerOutputKw] = useState('');

  const handleCreateStation = async () => {
    const station = await createStation({
      name: stationName,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    setStationId(station.id);
    toast.success('Station created.');
  };

  const handleCreateCharger = async () => {
    await createCharger({
      stationId,
      chargerCode,
      connectorType,
      powerOutputKw: Number(powerOutputKw),
    });
    toast.success('Charger created.');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        <h1 className="mb-6 text-3xl font-bold text-white">Operator Dashboard</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-card space-y-4 p-5">
            <h2 className="text-xl font-semibold text-white">Station</h2>
            <Input value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="Station name" />
            <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Address" />
            <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Latitude" />
            <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Longitude" />
            <Button onClick={handleCreateStation}>Create Station</Button>
          </section>

          <section className="glass-card space-y-4 p-5">
            <h2 className="text-xl font-semibold text-white">Charger</h2>
            <Input value={stationId} onChange={(event) => setStationId(event.target.value)} placeholder="Station ID" />
            <Input value={chargerCode} onChange={(event) => setChargerCode(event.target.value)} placeholder="Charger code" />
            <Input value={connectorType} onChange={(event) => setConnectorType(event.target.value)} placeholder="Connector type" />
            <Input value={powerOutputKw} onChange={(event) => setPowerOutputKw(event.target.value)} placeholder="Power output kW" />
            <Button onClick={handleCreateCharger}>Create Charger</Button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OperatorDashboard;

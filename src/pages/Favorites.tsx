import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getFavorites, type FavoriteStation } from '@/services/userService';

const Favorites = () => {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void getFavorites()
      .then(setFavorites)
      .catch(() => setError('Could not load favorites.'));
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        <h1 className="mb-6 text-3xl font-bold text-white">Favorites</h1>
        {error && <p className="text-red-400">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="glass-card p-4">
              <h2 className="font-semibold text-white">{favorite.station.name}</h2>
              <p className="mt-1 text-sm text-white/60">{favorite.station.address}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;

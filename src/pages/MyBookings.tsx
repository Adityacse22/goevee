import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/controllers/useAuth';
import { useBookings, useCancelBooking } from '@/controllers/useBookings';

const MyBookings = () => {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useBookings(user?.id);
  const cancelBooking = useCancelBooking();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar hasScrolled />
      <main className="container px-4 pt-28">
        <h1 className="mb-6 text-3xl font-bold text-white">My Bookings</h1>
        {isLoading && <p className="text-white/70">Loading bookings...</p>}
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{booking.booking_date}</p>
                <p className="text-sm text-white/60">
                  {booking.start_time} - {booking.end_time}
                </p>
                <p className="text-sm text-white/50">Status: {booking.status}</p>
              </div>
              {booking.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  onClick={() => cancelBooking.mutate(booking.id)}
                  disabled={cancelBooking.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;

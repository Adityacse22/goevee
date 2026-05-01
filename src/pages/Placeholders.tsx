
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-black text-white flex flex-col">
    <Navbar />
    <main className="flex-grow flex flex-col items-center justify-center p-4 pt-24">
      <div className="glass-card p-12 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">{title}</h1>
        <p className="text-white/60 mb-8">This page is currently under development. Check back soon for updates on your EV journey!</p>
        <button 
          onClick={() => window.history.back()}
          className="glass-button px-6 py-2 hover:bg-white/10 transition-all"
        >
          Go Back
        </button>
      </div>
    </main>
    <Footer />
  </div>
);

export const BookingHistory = () => <PlaceholderPage title="Booking History" />;
export const VehicleProfile = () => <PlaceholderPage title="My Vehicle" />;
export const Settings = () => <PlaceholderPage title="Settings" />;
export const Help = () => <PlaceholderPage title="Help & Support" />;
export const About = () => <PlaceholderPage title="About Evee" />;

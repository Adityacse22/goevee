import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User, LogOut, CheckCircle2, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createVehicle, updateProfile } from '@/services/userService';
import { useAuth } from '@/controllers/useAuth';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [connectorType, setConnectorType] = useState('');

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ fullName, phone });
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error('Failed to update profile.');
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleName.trim()) {
      toast.error('Please enter a vehicle name.');
      return;
    }

    try {
      await createVehicle({
        vehicleName,
        connectorType,
      });
      setVehicleName('');
      setConnectorType('');
      toast.success('Vehicle added successfully.');
    } catch (error) {
      toast.error('Failed to add vehicle.');
    }
  };

  const displayName = fullName || profile?.full_name || user?.fullName || user?.email?.split('@')[0] || 'EV Driver';
  const displayEmail = profile?.email || user?.email || 'No email associated';
  
  // Format join date securely
  const joinDate = profile?.created_at || user?.createdAt;
  const formattedJoinDate = joinDate 
    ? new Date(joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently Joined';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0A0B] pb-10">
      <Navbar hasScrolled />
      <main className="container px-4 pt-32 max-w-6xl mx-auto">
        
        {/* Page Header matching reference */}
        <div className="mb-8 border-b border-white/10 border-dashed pb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">Profile</h1>
          <p className="text-white/50 text-sm mt-2">View and manage your EV profile details here.</p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Column - Identity Card */}
          <div className="lg:col-span-4 sticky top-32">
            <div className="glass-card p-8 flex flex-col items-center text-center rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-ev-green/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
              <p className="text-ev-green text-sm font-medium mb-8">Premium EV Driver</p>
              
              {/* Reference style large avatar */}
              <div className="relative w-56 h-56 rounded-full bg-gradient-to-tr from-ev-blue/30 to-ev-green/30 p-2 mb-8 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden border-[6px] border-[#1a1a1a]">
                   <User className="w-24 h-24 text-white/20" />
                </div>
              </div>
              
              <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Member Since</span>
                  <span className="text-sm font-medium text-white">{formattedJoinDate}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Account Role</span>
                  <span className="text-sm font-medium text-white capitalize">{user?.role?.toLowerCase() || 'User'}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-white/10 text-white/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Right Column - Bio & EV details */}
          <div className="lg:col-span-8">
            <div className="glass-card p-8 md:p-10 rounded-2xl border border-white/5 shadow-2xl">
              
              {/* Header row with status pill */}
              <div className="flex justify-between items-start mb-10">
                 <h3 className="text-xl font-semibold text-white">Account & Contact Details</h3>
                 <div className="flex items-center gap-2 bg-ev-green/10 text-ev-green border border-ev-green/20 px-3 py-1.5 rounded-full text-xs font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-ev-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                   Account Active
                 </div>
              </div>
              
              {/* Account Grid */}
              <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 mb-10">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Full Name</label>
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="bg-transparent border-b border-white/10 border-x-0 border-t-0 rounded-none px-0 h-8 text-white focus-visible:ring-0 focus-visible:border-ev-blue text-lg font-medium shadow-none placeholder:text-white/20 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Email Address</label>
                  <div className="flex h-8 w-full items-center text-lg text-white/70 font-medium border-b border-transparent">
                    {displayEmail}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Phone Number</label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="bg-transparent border-b border-white/10 border-x-0 border-t-0 rounded-none px-0 h-8 text-white focus-visible:ring-0 focus-visible:border-ev-blue text-lg font-medium shadow-none placeholder:text-white/20 transition-colors"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Verification</label>
                  <div className="flex h-8 w-full items-center gap-2 text-lg text-white font-medium border-b border-transparent">
                    <CheckCircle2 className="w-5 h-5 text-ev-green" />
                    Verified Email
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-white/10 border-dashed border-t border-white/10 mb-10"></div>
              
              <h3 className="text-xl font-semibold text-white mb-10">My Primary Vehicle</h3>
              
              {/* Vehicle Grid */}
              <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 mb-12">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Vehicle Model</label>
                  <Input 
                    value={vehicleName} 
                    onChange={(e) => setVehicleName(e.target.value)} 
                    className="bg-transparent border-b border-white/10 border-x-0 border-t-0 rounded-none px-0 h-8 text-white focus-visible:ring-0 focus-visible:border-ev-blue text-lg font-medium shadow-none placeholder:text-white/20 transition-colors"
                    placeholder="e.g. Tesla Model 3"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 tracking-wider uppercase">Connector Type</label>
                  <Input 
                    value={connectorType} 
                    onChange={(e) => setConnectorType(e.target.value)} 
                    className="bg-transparent border-b border-white/10 border-x-0 border-t-0 rounded-none px-0 h-8 text-white focus-visible:ring-0 focus-visible:border-ev-blue text-lg font-medium shadow-none placeholder:text-white/20 transition-colors"
                    placeholder="e.g. CCS2, Type 2"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end p-6 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <label className="text-xs font-medium text-white/50 tracking-wider mb-4 block uppercase">Badges & Preferences</label>
                  <div className="flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1EAEdb] bg-[#1EAEdb]/10 border border-[#1EAEdb]/20 px-3 py-1.5 rounded-md">
                       <Star className="w-3.5 h-3.5 fill-current" /> Early Adopter
                    </span>
                    <span className="flex items-center text-xs font-medium text-white/70 bg-black/40 border border-white/10 px-3 py-1.5 rounded-md">
                       #EcoFriendly
                    </span>
                    <span className="flex items-center text-xs font-medium text-white/70 bg-black/40 border border-white/10 px-3 py-1.5 rounded-md">
                       #FastCharging
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleAddVehicle}
                    className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white flex-1 md:flex-none h-11 px-6 rounded-lg font-medium"
                  >
                    Add Vehicle
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-ev-blue hover:bg-ev-blue/90 text-white flex-1 md:flex-none h-11 px-6 rounded-lg font-medium shadow-[0_0_20px_rgba(30,174,219,0.3)] transition-all hover:shadow-[0_0_25px_rgba(30,174,219,0.5)]"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

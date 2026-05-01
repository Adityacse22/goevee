
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const Footer: React.FC = () => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    
    if (email) {
      toast.success("Thanks for subscribing to our newsletter!");
      (form.elements.namedItem('email') as HTMLInputElement).value = '';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        damping: 12
      }
    }
  };

  return (
    <motion.footer 
      className="relative bg-black/30 backdrop-blur-md border-t border-white/10 pt-16 pb-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {/* Background glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ev-blue/5 to-transparent -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company & App Info */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Link to="/" className="inline-flex items-center mb-4">
              <h2 className="text-3xl font-bold gradient-text">Evee</h2>
            </Link>
            
            <p className="text-white/70 mb-6">Empowering your electric journey with reliable charging stations and seamless booking experience.</p>
            
            <div className="flex space-x-4 mb-6">
              {[
                { icon: <Facebook size={18} />, name: "Facebook", href: "#" },
                { icon: <Twitter size={18} />, name: "Twitter", href: "#" },
                { icon: <Linkedin size={18} />, name: "LinkedIn", href: "#" },
                { icon: <Instagram size={18} />, name: "Instagram", href: "#" },
              ].map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="glass-button w-8 h-8 flex items-center justify-center rounded-full"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
            
            {/* Newsletter */}
            <div>
              <h3 className="text-white font-medium mb-3">Stay up to date</h3>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input 
                  name="email"
                  type="email" 
                  placeholder="Your email" 
                  className="glass-input w-full" 
                  required 
                />
                <Button 
                  type="submit" 
                  className="bg-ev-blue hover:bg-ev-blue/80"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              {[
                { name: "Home", href: "/" },
                { name: "Locate Chargers", href: "/ev-charger-station" },
                { name: "Booking", href: "/booking" },
                { name: "Pricing", href: "/pricing" },
                { name: "Dashboard", href: "/dashboard" },
                { name: "Admin", href: "/admin" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support & Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <span>Live Chat</span>
                  <MessageSquare size={14} />
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <span>API Docs</span>
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/70 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-white/70 hover:text-white transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal & Policies */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-white/70 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-white/70 hover:text-white transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <h3 className="text-white font-semibold mb-4">Download</h3>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  App Store
                </Button>
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  Google Play
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom section */}
        <motion.div 
          className="mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <div className="text-white/50 text-sm">© 2025 Evee. All rights reserved.</div>
            
            {/* Language selector */}
            <select className="bg-transparent text-white/50 text-sm border border-white/20 rounded px-2 py-1">
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {["visa", "mastercard", "amex", "paypal"].map(card => (
                <div key={card} className="w-8 h-6 bg-white/10 rounded flex items-center justify-center text-white/60 text-xs">
                  {card === "paypal" ? "PP" : card.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-white/50 text-xs">SSL Secure</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;

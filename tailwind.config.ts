
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// EV Charging App Custom Colors
				"ev-blue": "#1EAEDB",
				"ev-green": "#10B981",
				"ev-navy": "#1A1F2C",
				"ev-orange": "#F97316",
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				"accordion-down": {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				"accordion-up": {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				"pulse-glow": {
					"0%, 100%": { 
						boxShadow: "0 0 15px 5px rgba(30, 174, 219, 0.2)" 
					},
					"50%": { 
						boxShadow: "0 0 30px 10px rgba(30, 174, 219, 0.4)" 
					},
				},
				"float": {
					"0%, 100%": { 
						transform: "translateY(0px)" 
					},
					"50%": { 
						transform: "translateY(-10px)" 
					},
				},
				"slide-up": {
					from: { 
						transform: "translateY(100%)",
						opacity: "0" 
					},
					to: { 
						transform: "translateY(0)",
						opacity: "1" 
					},
				},
				"fade-in": {
					from: { 
						opacity: "0" 
					},
					to: { 
						opacity: "1" 
					},
				},
				"text-shimmer": {
					"0%": {
						backgroundPosition: "-200% 0"
					},
					"100%": {
						backgroundPosition: "200% 0"
					}
				}
			},
			animation: {
				"accordion-down": 'accordion-down 0.2s ease-out',
				"accordion-up": 'accordion-up 0.2s ease-out',
				"pulse-glow": 'pulse-glow 2s infinite',
				"float": 'float 6s ease-in-out infinite',
				"slide-up": 'slide-up 0.5s ease-out',
				"fade-in": 'fade-in 0.5s ease-out',
				"text-shimmer": "text-shimmer 6s infinite"
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-radial-to-tr': 'radial-gradient(115% 90% at 0% 100%, var(--tw-gradient-stops))',
				'blue-green-gradient': 'linear-gradient(135deg, #1EAEDB 0%, #10B981 100%)',
				'dark-gradient': 'linear-gradient(to bottom, #1A1F2C 0%, #121318 100%)',
				'neon-glow': 'linear-gradient(90deg, #1EAEDB 0%, #10B981 50%, #1EAEDB 100%)',
			},
			boxShadow: {
				'neon-blue': '0 0 15px 5px rgba(30, 174, 219, 0.3)',
				'neon-green': '0 0 15px 5px rgba(16, 185, 129, 0.3)',
				'inner-glow': 'inset 0 0 20px 5px rgba(30, 174, 219, 0.15)',
				'3d': '0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 5px rgba(0, 0, 0, 0.1)',
			},
			transitionTimingFunction: {
				'spring-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'elastic': 'cubic-bezier(0.25, 0.1, 0.25, 1.5)'
			},
			transformStyle: {
				'3d': 'preserve-3d',
			},
			backfaceVisibility: {
				'hidden': 'hidden',
			},
		}
	},
	plugins: [
		animate,
		function({ addUtilities }) {
			const newUtilities = {
				'.perspective': {
					perspective: '1000px',
				},
				'.preserve-3d': {
					transformStyle: 'preserve-3d',
				},
				'.backface-hidden': {
					backfaceVisibility: 'hidden',
				},
				'.transform-3d': {
					transformStyle: 'preserve-3d',
				}
			};
			addUtilities(newUtilities);
		}
	],
} satisfies Config;

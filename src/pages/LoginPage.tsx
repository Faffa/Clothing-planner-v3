import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-espresso flex flex-col md:flex-row">
      {/* Left - Branding */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-12 md:py-0 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="relative z-10"
        >
          <h1 className="font-display text-4xl md:text-6xl text-gold tracking-[0.2em] uppercase mb-4">
            Maison
          </h1>
          <p className="text-parchment-dark/50 text-lg font-light max-w-md leading-relaxed">
            Your personal wardrobe atelier. Curate, plan, and perfect your style with intention.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 flex gap-6 md:gap-12 text-parchment-dark/30 text-xs uppercase tracking-[0.2em] relative z-10"
        >
          <span>Wardrobe</span>
          <span>Planning</span>
          <span>Style</span>
        </motion.div>
      </div>

      {/* Right - Sign In */}
      <div className="w-full md:w-[480px] bg-parchment flex flex-col justify-center px-6 md:px-16 py-12 md:py-0 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <h2 className="font-display text-2xl text-ink mb-2">Welcome</h2>
          <p className="text-ink-muted text-sm mb-8">Sign in to access your wardrobe</p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-parchment-deep rounded-xl px-6 py-3.5 text-sm font-medium text-ink hover:bg-parchment-dark hover:border-ink-muted/20 transition-all duration-200 shadow-maison hover:shadow-maison-md"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-ink-muted/50 text-[10px] text-center mt-6 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}

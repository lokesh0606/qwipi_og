/**
 * Signup Page - Qwipi AI Registration
 * 
 * Styled with dark theme, glassmorphism, and Three.js background.
 */

import { useState, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import brandLogo from '../assets/brand-logo.png';
import { BrandedText } from './BrandedText';

const Scene = lazy(() => import('./Scene'));

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { signup } = useAuth();
    const navigate = useNavigate();

    // Password validation (bcrypt has 72-byte limit)
    const isPasswordTooLong = new TextEncoder().encode(password).length > 72;
    const isPasswordValid = password.length >= 8 && !isPasswordTooLong;
    const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (isPasswordTooLong) {
            setError('Password must be 72 characters or fewer.');
            return;
        }

        if (!isPasswordValid) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (!doPasswordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await signup(email, password);
            navigate('/', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Three.js Background */}
            <Suspense fallback={<div className="absolute inset-0 bg-black -z-10" />}>
                <Scene />
            </Suspense>

            {/* Signup Form */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md mx-4"
                >
                    {/* Glass Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        {/* Logo & Title */}
                        <div className="flex flex-col items-center mb-8">
                            <img
                                src={brandLogo}
                                alt="Logo"
                                className="w-16 h-16 mb-4"
                            />
                            <h1 className="text-2xl font-semibold text-white">
                                Create Account
                            </h1>
                            <p className="text-white/50 text-sm mt-1">
                                Join <BrandedText /> today
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-white/70 text-sm font-medium">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-white/70 text-sm font-medium">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    />
                                </div>
                                {/* Password strength indicator */}
                                {password && (
                                    <div className={`flex items-center gap-1 text-xs ${isPasswordTooLong ? 'text-red-400' : isPasswordValid ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {isPasswordTooLong ? (
                                            <AlertCircle className="w-3 h-3" />
                                        ) : isPasswordValid ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        {isPasswordTooLong
                                            ? 'Password too long (max 72 characters)'
                                            : isPasswordValid
                                                ? 'Password is strong enough'
                                                : 'Minimum 8 characters required'}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="text-white/70 text-sm font-medium">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    />
                                </div>
                                {/* Match indicator */}
                                {confirmPassword && (
                                    <div className={`flex items-center gap-1 text-xs ${doPasswordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                                        {doPasswordsMatch ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !isPasswordValid || !doPasswordsMatch}
                                className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-white/50 text-sm">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

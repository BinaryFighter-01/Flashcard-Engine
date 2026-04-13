'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-client';
import Link from 'next/link';

export default function SignUp() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [googleLoading, setGoogleLoading] = useState(false);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');
     const [user, setUser] = useState<any>(null);
     const router = useRouter();
     const supabase = createClient();

     useEffect(() => {
          let isMounted = true;

          const checkUser = async () => {
               try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (isMounted && session?.user) {
                         router.push('/dashboard');
                    }
               } catch (err) {
                    // Silently fail on auth check errors
                    if (isMounted) {
                         console.log('Auth check skipped');
                    }
               }
          };

          checkUser();
          return () => {
               isMounted = false;
          };
     }, []);

     const handleSignUp = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          setSuccess('');

          // Validate password
          if (password.length < 6) {
               setError('Password must be at least 6 characters');
               setLoading(false);
               return;
          }

          try {
               const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                         emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
               });

               if (error) throw error;

               setSuccess('Check your email to confirm your account and log in!');
               setEmail('');
               setPassword('');
               setUser(data.user);

               // Auto-redirect after 3 seconds
               setTimeout(() => {
                    router.push('/auth/login');
               }, 3000);
          } catch (err: any) {
               setError(err.message || 'An error occurred during sign up');
          } finally {
               setLoading(false);
          }
     };

     const handleGoogleSignIn = async () => {
          setGoogleLoading(true);
          setError('');

          try {
               const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                         redirectTo: `${window.location.origin}/auth/callback`,
                    },
               });

               if (error) throw error;
          } catch (err: any) {
               setError(err.message || 'Google sign up failed');
               setGoogleLoading(false);
          }
     };

     if (success) {
          return (
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="w-full max-w-md space-y-8 text-center">
                         <div>
                              <h1 className="text-3xl font-bold text-gradient mb-4">RecallAI</h1>
                              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                                   <p className="text-green-300 font-semibold mb-2">✓ Account created successfully!</p>
                                   <p className="text-gray-300 text-sm mb-4">{success}</p>
                                   <p className="text-gray-400 text-xs">Redirecting to login...</p>
                              </div>
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="flex items-center justify-center min-h-screen px-4">
               <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                         <h1 className="text-3xl font-bold text-gradient mb-2">RecallAI</h1>
                         <p className="text-gray-400">Create your account to get started</p>
                    </div>

                    {/* Google Sign Up */}
                    <button
                         onClick={handleGoogleSignIn}
                         disabled={googleLoading || loading}
                         className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                         </svg>
                         {googleLoading ? 'Signing up with Google...' : 'Sign up with Google'}
                    </button>

                    <div className="relative">
                         <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-600"></div>
                         </div>
                         <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-gray-950 text-gray-400">Or sign up with email</span>
                         </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                         {error && (
                              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                                   {error}
                              </div>
                         )}

                         <div>
                              <label className="block text-sm font-medium mb-2">Email</label>
                              <input
                                   type="email"
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                                   placeholder="you@example.com"
                                   className="input-primary"
                                   required
                                   disabled={loading || googleLoading}
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium mb-2">Password</label>
                              <input
                                   type="password"
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                                   placeholder="••••••••"
                                   className="input-primary"
                                   required
                                   disabled={loading || googleLoading}
                              />
                              <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                         </div>

                         <button
                              type="submit"
                              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || googleLoading}
                         >
                              {loading ? 'Creating Account...' : 'Sign Up with Email'}
                         </button>
                    </form>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
                         <p className="font-semibold mb-1">📧 Email Verification</p>
                         <p>After signing up, you'll receive an email to confirm your account. Check your email and click the link to verify.</p>
                    </div>

                    <p className="text-center text-gray-400 text-sm">
                         Already have an account?{' '}
                         <Link href="/auth/login" className="text-accent-amber hover:underline">
                              Sign In
                         </Link>
                    </p>
               </div>
          </div>
     );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-client';
import Link from 'next/link';

export default function Login() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [googleLoading, setGoogleLoading] = useState(false);
     const [authChecking, setAuthChecking] = useState(true);
     const [error, setError] = useState('');
     const [showResendEmail, setShowResendEmail] = useState(false);
     const [resendLoading, setResendLoading] = useState(false);
     const router = useRouter();
     const supabase = createClient();

     useEffect(() => {
          let isMounted = true;

          const checkUser = async () => {
               try {
                    const {
                         data: { session },
                    } = await supabase.auth.getSession();
                    if (isMounted) {
                         if (session?.user) {
                              // User is already logged in, redirect to dashboard
                              router.replace('/dashboard');
                         } else {
                              // User is not logged in, show login page
                              setAuthChecking(false);
                         }
                    }
               } catch (err) {
                    if (isMounted) {
                         console.log('Auth check error:', err);
                         setAuthChecking(false);
                    }
               }
          };

          checkUser();
          return () => {
               isMounted = false;
          };
     }, [router, supabase]);

     // Show loading while checking auth
     if (authChecking) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center space-y-4">
                         <div className="spinner-glass w-12 h-12 mx-auto"></div>
                         <p className="text-gray-400">Checking authentication...</p>
                    </div>
               </div>
          );
     }

     const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          setShowResendEmail(false);

          try {
               const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
               });

               if (error) {
                    // Supabase returns "Invalid login credentials" for both wrong password AND unverified email
                    // We need to check if it's an email verification issue
                    if (error.message.includes('Invalid login credentials') || error.message.includes('incorrect_credentials')) {
                         setError('❌ Unable to sign in. This could be because:\n1. Your email hasn\'t been verified yet\n2. Incorrect email or password\n\nCheck your email for a verification link, or request a new one below.');
                         setShowResendEmail(true);
                    } else if (error.message.includes('Email not confirmed')) {
                         setError('❌ Email not confirmed yet. Check your inbox for a confirmation email from RecallAI. Click the link to verify your account.');
                         setShowResendEmail(true);
                    } else {
                         setError(error.message || 'Sign in failed. Please try again.');
                    }
                    throw error;
               }

               setEmail('');
               setPassword('');
               router.push('/dashboard');
          } catch (err: any) {
               console.error('Login error:', err);
          } finally {
               setLoading(false);
          }
     };

     const handleResendConfirmationEmail = async () => {
          if (!email) {
               setError('Please enter your email address first');
               return;
          }

          setResendLoading(true);
          setError('');

          try {
               const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email,
               });

               if (error) throw error;

               setError('');
               setShowResendEmail(false);
               alert('✅ Confirmation email sent! Check your inbox and click the verification link.');
          } catch (err: any) {
               setError(err.message || 'Failed to resend email. Please try again.');
          } finally {
               setResendLoading(false);
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
               setError(err.message || 'Google sign in failed');
               setGoogleLoading(false);
          }
     };

     return (
          <div className="flex items-center justify-center min-h-screen px-4">
               <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                         <div className="text-5xl mb-3 font-bold">✨</div>
                         <h1 className="text-4xl font-bold text-gradient mb-2">RecallAI</h1>
                         <p className="text-gray-400 text-lg">Master learning with spaced repetition</p>
                    </div>

                    {/* Main Card */}
                    <div className="card-container mb-6 space-y-6">
                         {/* Google Sign In */}
                         <button
                              onClick={handleGoogleSignIn}
                              disabled={googleLoading || loading}
                              className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                         >
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                   <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                   <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                   <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                   <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                         </button>

                         {/* Divider */}
                         <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                   <div className="w-full border-t border-white/10"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                   <span className="px-3 bg-gradient-to-r from-transparent via-dark-bg to-transparent text-gray-400 text-xs uppercase tracking-wider">Or continue with email</span>
                              </div>
                         </div>

                         {/* Email & Password Form */}
                         <form onSubmit={handleLogin} className="space-y-4">
                              {error && (
                                   <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm space-y-3">
                                        <p>{error}</p>
                                        {showResendEmail && (
                                             <button
                                                  type="button"
                                                  onClick={handleResendConfirmationEmail}
                                                  disabled={resendLoading}
                                                  className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs font-semibold transition-all disabled:opacity-50"
                                             >
                                                  {resendLoading ? 'Sending...' : '📧 Resend Confirmation Email'}
                                             </button>
                                        )}
                                   </div>
                              )}

                              <div>
                                   <label className="block text-sm font-medium mb-2 text-gray-300">Email address</label>
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
                                   <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                                   <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-primary"
                                        required
                                        disabled={loading || googleLoading}
                                   />
                              </div>

                              <button
                                   type="submit"
                                   className="w-full btn-primary py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                   disabled={loading || googleLoading}
                              >
                                   {loading ? 'Signing in...' : 'Sign in'}
                              </button>
                         </form>

                         {/* Sign up link */}
                         <div className="pt-2 text-center">
                              <p className="text-gray-400 text-sm">
                                   Don't have an account?{' '}
                                   <Link href="/auth/signup" className="text-accent-amber hover:text-accent-amber/80 font-semibold transition-colors">
                                        Create one
                                   </Link>
                              </p>
                         </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-300 text-sm space-y-2">
                         <p className="font-semibold">💡 Can't sign in?</p>
                         <ul className="text-xs leading-relaxed space-y-1 text-blue-200">
                              <li>✓ Check that you've verified your email (link in confirmation email)</li>
                              <li>✓ Check spam folder for verification email</li>
                              <li>✓ Use "Resend Confirmation Email" if needed</li>
                              <li>✓ Verify email address and password are correct</li>
                         </ul>
                    </div>
               </div>
          </div>
     );
}

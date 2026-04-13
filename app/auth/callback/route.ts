import { createClient } from '@/app/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
     const requestUrl = new URL(request.url);
     const code = requestUrl.searchParams.get('code');
     const state = requestUrl.searchParams.get('state');

     if (code) {
          try {
               const supabase = createClient();
               const { error } = await supabase.auth.exchangeCodeForSession(code);

               if (error) throw error;

               // Return redirect to dashboard
               return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
          } catch (error: any) {
               console.error('Auth callback error:', error);
               // On error, redirect to login with error message
               return NextResponse.redirect(
                    new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
               );
          }
     }

     return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}

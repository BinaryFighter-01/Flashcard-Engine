import { createClient } from '@/app/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
     const requestUrl = new URL(request.url);
     const code = requestUrl.searchParams.get('code');

     if (code) {
          try {
               const supabase = createClient();
               const { error } = await supabase.auth.exchangeCodeForSession(code);

               if (error) throw error;

               // Redirect to dashboard after successful authentication
               return NextResponse.redirect(
                    new URL('/dashboard', requestUrl.origin),
                    {
                         status: 303, // Use 303 See Other for POST-redirect-GET pattern
                    }
               );
          } catch (error: any) {
               console.error('Auth callback error:', error);
               // On error, redirect to login with error message
               return NextResponse.redirect(
                    new URL(
                         `/auth/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`,
                         requestUrl.origin
                    ),
                    { status: 303 }
               );
          }
     }

     return NextResponse.redirect(new URL('/auth/login', requestUrl.origin), { status: 303 });
}

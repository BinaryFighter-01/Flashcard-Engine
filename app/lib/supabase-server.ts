import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createClient = () => {
     const cookieStore = cookies();

     return createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
               auth: {
                    persistSession: false,
               },
               global: {
                    headers: {
                         cookie: cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join('; '),
                    },
               },
          }
     );
};

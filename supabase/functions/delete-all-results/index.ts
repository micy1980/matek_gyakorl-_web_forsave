import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_PASSWORD = 'admin123';

// Note: verify_jwt is set to false for this function

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { password, mode } = await req.json();

    console.log('Received request:', { password: password ? '***' : 'missing', mode });

    if (!password || password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Hibás jelszó!' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!mode || !['random', 'ttable'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen mode paraméter!' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tableName = mode === 'random' ? 'results_random' : 'results_ttable';

    console.log('Attempting to delete from table:', tableName);

    const { data: allRows, error: fetchError } = await supabase
      .from(tableName)
      .select('id');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Lekérdezési hiba történt.' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (allRows && allRows.length > 0) {
      console.log(`Deleting ${allRows.length} rows from ${tableName}`);
      const ids = allRows.map(row => row.id);
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Törlési hiba történt.' }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log(`Successfully deleted ${allRows.length} rows from ${tableName}`);
    } else {
      console.log('No rows to delete from', tableName);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: allRows?.length || 0,
        message: 'Az összes mentett adat törlésre került.' 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Szerver hiba történt.' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
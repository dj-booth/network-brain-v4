import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// import Papa from 'papaparse'; // Temporarily commented out
import { Database } from '@/types/supabase'; // Use path alias

// Define the expected structure of the mapping from the frontend
interface ColumnMapping {
  [csvHeader: string]: keyof Database['public']['Tables']['profiles']['Row'] | ''; // Map CSV header to profile column name or ignore ('')
}

export async function POST(request: NextRequest) {
  // Immediately return an error indicating the feature is disabled for debugging
  return NextResponse.json({ error: 'CSV Import temporarily disabled for build debugging.' }, { status: 503 }); // 503 Service Unavailable

  // --- Rest of the code commented out for debugging ---
  /*
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const formData = await request.formData();
  const file = formData.get('csvFile') as File | null;
  const mappingString = formData.get('mapping') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No CSV file provided.' }, { status: 400 });
  }

  if (!mappingString) {
    return NextResponse.json({ error: 'No column mapping provided.' }, { status: 400 });
  }

  let mapping: ColumnMapping;
  try {
    mapping = JSON.parse(mappingString);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid column mapping format.' }, { status: 400 });
  }

  // Read file content
  const fileContent = await file.text();

  try {
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,       // Use the first row as headers
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers, booleans
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV Parsing errors:', parseResult.errors);
      // Decide if you want to proceed or return an error
      // For now, let's return an error if any parsing issue occurs
      return NextResponse.json({ error: 'Error parsing CSV file.', details: parseResult.errors }, { status: 400 });
    }

    const parsedData = parseResult.data as Record<string, any>[];

    // Transform data based on mapping
    const profilesToUpsert = parsedData.map(row => {
      const profile: Partial<Database['public']['Tables']['profiles']['Row']> = {};
      for (const csvHeader in mapping) {
        const dbColumn = mapping[csvHeader];
        if (dbColumn && row.hasOwnProperty(csvHeader)) {
          // Basic type handling - might need more robust validation/conversion
          let value = row[csvHeader];
          
          // Example: Convert potential string numbers/booleans back if dynamicTyping didn't catch them perfectly
          // You might need more specific conversions based on your db schema (dates, specific numbers, etc.)
          if (typeof value === 'string') {
             if (!isNaN(Number(value)) && value.trim() !== '') value = Number(value);
             else if (value.toLowerCase() === 'true') value = true;
             else if (value.toLowerCase() === 'false') value = false;
          }
          
          // Handle empty strings explicitly if needed, e.g., convert to null
          if (value === '') value = null;

          profile[dbColumn] = value;
        }
      }
      // Add a default value if necessary, e.g., 'completed' status
      // profile.completed = profile.completed ?? false; 
      
      // Ensure required fields like full_name have a value if possible
      if (!profile.full_name) {
         // Attempt to construct full_name if first/last names are mapped separately
         // Or mark this row as invalid if full_name is essential and missing
         console.warn("Row skipped or potentially invalid: Missing 'full_name' after mapping.", row);
         return null; // Skip rows that don't map to essential fields
      }
      
      return profile;
    }).filter(p => p !== null) as (Partial<Database['public']['Tables']['profiles']['Row']> & { full_name: string })[]; // Assert full_name exists

    if (profilesToUpsert.length === 0) {
       return NextResponse.json({ message: 'No valid profiles to import after mapping.' , importedCount: 0 }, { status: 200 });
    }

    // Upsert data into Supabase profiles table
    // Using 'email' as the conflict target, change if you use a different unique identifier
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilesToUpsert, { onConflict: 'email' }) // Adjust onConflict based on your unique constraints
      .select(); // Select to get the result

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to import data into database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'CSV data imported successfully.', importedCount: data?.length ?? 0 }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing CSV import:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during import.', details: error.message }, { status: 500 });
  }
  */
} 
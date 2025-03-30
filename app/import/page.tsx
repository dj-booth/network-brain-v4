'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Papa from 'papaparse';
import { Database } from '@/types/supabase';

// Define the type for a profile row (adjust based on your actual type)
// We extract the keys for the dropdown mapping
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileColumn = keyof ProfileRow;

// --- Get Profile Columns (Consider fetching dynamically in a real app) ---
// Manually list columns or derive from a more complete type source if needed.
// This is a simplified way based on the assumption the generated type includes all relevant columns.
// IMPORTANT: Ensure 'id', 'profile_created_at', 'last_scraped_at' or other auto-generated/non-importable columns are handled.
const ALL_PROFILE_COLUMNS: ProfileColumn[] = [
  // List essential and importable columns from your 'profiles' table here
  // Example columns - **REPLACE/ADD based on your actual schema!**
  'full_name', 
  'email',
  'phone',
  'linkedin',
  'location',
  'referral_source', 
  'current_plan', 
  'startup_name',
  'cofounders_context',
  'startup_differentiator',
  'startup_validation', 
  'job_search_preferences',
  'inspiring_companies',
  'hypothetical_startup_idea',
  'timeline_to_start',
  'skillset',
  'skillset_extra',
  'additional_interests',
  'desired_introductions',
  'long_term_goal',
  'nomination',
  'new_start_behavior',
  'discomfort_trigger',
  'group_dynamics',
  'core_values',
  'motivation_type',
  'stress_response',
  'focus_area',
  'self_description',
  'decision_style',
  'failure_response',
  'final_notes',
  'sentiment',
  'summary',
  'transcript',
  'submitted_at', 
  'completed',
  'credibility_score'
  // 'id', 'profile_created_at', 'last_scraped_at' - Usually excluded from import mapping
];

// --- Component --- 

export default function ImportPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, ProfileColumn | ''>>({});
  const [importStatus, setImportStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportStatus(''); // Reset status
      setCsvHeaders([]); // Reset headers
      setMapping({}); // Reset mapping

      // Parse headers using Papaparse on the client side
      Papa.parse(file, {
        header: false, // We only want the first row
        preview: 1,    // Only parse the first row
        complete: (results) => {
          const headers = results.data[0] as string[];
          setCsvHeaders(headers);
          // Initialize mapping - default to ignore
          const initialMapping: Record<string, ProfileColumn | ''> = {};
          headers.forEach(header => {
            // Basic auto-mapping attempt (optional)
            const potentialMatch = ALL_PROFILE_COLUMNS.find(col => 
                col.toLowerCase() === header.toLowerCase().replace(/\s+/g, '_') || // Match underscore separated
                col.toLowerCase() === header.toLowerCase() // Match exact case-insensitive
            );
             initialMapping[header] = potentialMatch || '';
          });
          setMapping(initialMapping);
        },
        error: (error) => {
            console.error("Error parsing CSV headers:", error);
            setImportStatus(`Error reading CSV headers: ${error.message}`);
        }
      });
    }
  };

  const handleMappingChange = (csvHeader: string, dbColumn: ProfileColumn | '') => {
    setMapping(prev => ({ ...prev, [csvHeader]: dbColumn }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csvFile) {
      setImportStatus('Please select a CSV file.');
      return;
    }

    setIsLoading(true);
    setImportStatus('Importing...');

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setImportStatus(`Import failed: ${result.error || 'Unknown error'}${result.details ? ": " + JSON.stringify(result.details) : ""}`);
      } else {
        setImportStatus(`Import successful! ${result.importedCount} profiles imported/updated. ${result.message || ''}`);
        // Optionally reset form
        // setCsvFile(null);
        // setCsvHeaders([]);
        // setMapping({});
      }
    } catch (error: any) {
      console.error('Import fetch error:', error);
      setImportStatus(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Import Profiles from CSV</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow-md">
        <div>
          <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">
            CSV File
          </label>
          <input
            type="file"
            id="csvFile"
            accept=".csv"
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
        </div>

        {csvHeaders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Map CSV Columns to Database Fields</h2>
            <p className="text-sm text-gray-600 mb-4">Select the corresponding database field for each column in your CSV. Choose "-- Ignore --" to skip a column.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CSV Column Header
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Database Profile Field
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvHeaders.map((header) => {
                    const isMapped = mapping[header] !== '';
                    return (
                      <tr key={header}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{header}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select
                            value={mapping[header] || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value as ProfileColumn | '')}
                            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${isMapped ? 'bg-green-50' : 'bg-red-50'}`}
                          >
                            <option value="">-- Ignore --</option>
                            {ALL_PROFILE_COLUMNS.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {csvFile && csvHeaders.length > 0 && (
           <div>
             <button
               type="submit"
               disabled={isLoading}
               className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
             >
               {isLoading ? 'Importing...' : 'Import Data'}
             </button>
           </div>
        )}
       
        {importStatus && (
          <div className={`mt-4 p-4 rounded ${importStatus.startsWith('Import successful') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>{importStatus}</p>
          </div>
        )}
      </form>
    </div>
  );
} 
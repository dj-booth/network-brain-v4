'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
// import Papa from 'papaparse'; // Temporarily commented out
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
  const [activeTab, setActiveTab] = useState<'csv' | 'spreadsheet'>('csv');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportStatus('CSV selected. Please verify mapping below. (Parsing disabled temporarily)'); // Updated message
      setCsvHeaders(['header1_temp', 'header2_temp', 'header3_temp']); // Set dummy headers
      setMapping({}); // Reset mapping

      // // Parse headers using Papaparse on the client side
      // Papa.parse(file, {
      //   header: false, // We only want the first row
      //   preview: 1,    // Only parse the first row
      //   complete: (results) => {
      //     const headers = results.data[0] as string[];
      //     setCsvHeaders(headers);
      //     // Initialize mapping - default to ignore
      //     const initialMapping: Record<string, ProfileColumn | ''> = {};
      //     headers.forEach(header => {
      //       // Basic auto-mapping attempt (optional)
      //       const potentialMatch = ALL_PROFILE_COLUMNS.find(col => 
      //           col.toLowerCase() === header.toLowerCase().replace(/\s+/g, '_') || // Match underscore separated
      //           col.toLowerCase() === header.toLowerCase() // Match exact case-insensitive
      //       );
      //        initialMapping[header] = potentialMatch || '';
      //     });
      //     setMapping(initialMapping);
      //   },
      //   error: (error) => {
      //       console.error("Error parsing CSV headers:", error);
      //       setImportStatus(`Error reading CSV headers: ${error.message}`);
      //   }
      // });

      // Temporary: Set up basic mapping for dummy headers
      const initialMapping: Record<string, ProfileColumn | ''> = {};
      ['header1_temp', 'header2_temp', 'header3_temp'].forEach(header => {
        initialMapping[header] = ''; // Default to ignore
      });
      setMapping(initialMapping);
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
    
    setImportStatus('Import functionality temporarily disabled while debugging build issues.');
    return; // Disable submission temporarily

    // setIsLoading(true);
    // setImportStatus('Importing...');

    // const formData = new FormData();
    // formData.append('csvFile', csvFile);
    // formData.append('mapping', JSON.stringify(mapping));

    // try {
    //   const response = await fetch('/api/import', {
    //     method: 'POST',
    //     body: formData,
    //   });

    //   const result = await response.json();

    //   if (!response.ok) {
    //     setImportStatus(`Import failed: ${result.error || 'Unknown error'}${result.details ? ": " + JSON.stringify(result.details) : ""}`);
    //   } else {
    //     setImportStatus(`Import successful! ${result.importedCount} profiles imported/updated. ${result.message || ''}`);
    //     // Optionally reset form
    //     // setCsvFile(null);
    //     // setCsvHeaders([]);
    //     // setMapping({});
    //   }
    // } catch (error: any) {
    //   console.error('Import fetch error:', error);
    //   setImportStatus(`An error occurred: ${error.message}`);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Import Data</h2>
        <p className="text-gray-600 mb-4">
          Import profiles and other data from various sources.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'csv' ? 'border-b-2 border-[rgb(255,196,3)] text-[rgb(66,66,69)]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('csv')}
        >
          CSV Import
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'spreadsheet' ? 'border-b-2 border-[rgb(255,196,3)] text-[rgb(66,66,69)]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('spreadsheet')}
        >
          Spreadsheet Import
        </button>
      </div>
      
      {/* CSV Import Form */}
      {activeTab === 'csv' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">
                CSV File
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Select a CSV file with profile data. Headers should match database fields.
              </p>
            </div>

            {csvHeaders.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Map CSV Columns to Database Fields</h3>
                <p className="text-sm text-gray-600 mb-4">Select the corresponding database field for each column in your CSV.</p>
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
                      {csvHeaders.map((header: string) => { 
                        const isMapped = mapping[header] !== '';
                        return (
                          <tr key={header}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{header}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={mapping[header] || ''}
                                onChange={(e) => handleMappingChange(header, e.target.value as ProfileColumn | '')}
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm text-sm ${isMapped ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[rgb(255,196,3)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
                >
                  {isLoading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            )}
          
            {importStatus && (
              <div className={`mt-4 p-4 rounded ${importStatus.startsWith('Import successful') ? 'bg-green-100 text-green-800' : importStatus.includes('disabled') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                <p>{importStatus}</p>
              </div>
            )}
          </form>
        </div>
      )}
      
      {/* Spreadsheet Import Panel */}
      {activeTab === 'spreadsheet' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Import from Spreadsheet</h3>
          <p className="text-gray-600 mb-4">
            Connect to a Google Sheets or Excel file to import profile data.
          </p>
          <div className="mb-6">
            <label htmlFor="spreadsheetUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Spreadsheet URL
            </label>
            <input
              type="text"
              id="spreadsheetUrl"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[rgb(255,196,3)] focus:border-[rgb(255,196,3)]"
            />
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[rgb(255,196,3)] hover:bg-opacity-90 focus:outline-none"
          >
            Connect Spreadsheet
          </button>
          <p className="mt-4 text-xs text-gray-500">
            Note: This feature is coming soon. Currently in development.
          </p>
        </div>
      )}
    </div>
  );
} 
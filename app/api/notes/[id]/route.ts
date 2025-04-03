import { NextResponse } from 'next/server';

// This is a stub API route for profile notes
// It will be replaced with actual implementation later

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get profile ID from route params
    const profileId = params.id;
    
    // For now, return mock data
    // In a real implementation, we would fetch notes from the database
    
    const mockNotes = [
      {
        id: '1',
        profile_id: profileId,
        content: 'Had a great initial call with them. Very enthusiastic about potential connections in the fintech space.',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        profile_id: profileId,
        content: 'Follow-up email sent regarding intro to Jane at Company XYZ.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return NextResponse.json(mockNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = params.id;
    const data = await request.json();
    
    // Validate input
    if (!data.content || !data.content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }
    
    // Mock a successful response
    // In a real implementation, we would save the note to the database
    
    const newNote = {
      id: Date.now().toString(),
      profile_id: profileId,
      content: data.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Log success for debugging
    console.log(`Created note for profile ${profileId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Note created successfully',
      note: newNote
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create note',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifyTestData() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check profiles
    const profilesResult = await client.query(`
      SELECT COUNT(*), 
             MIN(credibility_score) as min_score,
             MAX(credibility_score) as max_score,
             COUNT(DISTINCT location) as unique_locations
      FROM profiles
    `);
    console.log('Profiles Summary:');
    console.log(`- Total profiles: ${profilesResult.rows[0].count}`);
    console.log(`- Credibility score range: ${profilesResult.rows[0].min_score} to ${profilesResult.rows[0].max_score}`);
    console.log(`- Unique locations: ${profilesResult.rows[0].unique_locations}\n`);

    // Check embeddings
    const embeddingsResult = await client.query(`
      SELECT type, COUNT(*) as count
      FROM embeddings
      GROUP BY type
      ORDER BY type
    `);
    console.log('Embeddings by Type:');
    embeddingsResult.rows.forEach(row => {
      console.log(`- ${row.type}: ${row.count}`);
    });
    console.log();

    // Check introductions
    const introductionsResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM introductions
      GROUP BY status
      ORDER BY status
    `);
    console.log('Introductions by Status:');
    introductionsResult.rows.forEach(row => {
      console.log(`- ${row.status}: ${row.count}`);
    });
    console.log();

    // Check email logs
    const emailResult = await client.query('SELECT COUNT(*) FROM email_logs');
    console.log(`Email Logs: ${emailResult.rows[0].count} entries\n`);

    // Check audit logs
    const auditResult = await client.query(`
      SELECT action_type, COUNT(*) as count
      FROM audit_logs
      GROUP BY action_type
      ORDER BY action_type
    `);
    console.log('Audit Logs by Action:');
    auditResult.rows.forEach(row => {
      console.log(`- ${row.action_type}: ${row.count}`);
    });
    console.log();

    // Sample profile with relationships
    const sampleProfileResult = await client.query(`
      SELECT p.full_name,
             COUNT(DISTINCT e.id) as embedding_count,
             COUNT(DISTINCT i_from.id) as introductions_made,
             COUNT(DISTINCT i_to.id) as introductions_received,
             COUNT(DISTINCT el.id) as emails_sent,
             COUNT(DISTINCT al.id) as audit_entries
      FROM profiles p
      LEFT JOIN embeddings e ON e.profile_id = p.id
      LEFT JOIN introductions i_from ON i_from.from_profile_id = p.id
      LEFT JOIN introductions i_to ON i_to.to_profile_id = p.id
      LEFT JOIN email_logs el ON el.profile_id = p.id
      LEFT JOIN audit_logs al ON al.profile_id = p.id
      GROUP BY p.id, p.full_name
      LIMIT 1
    `);
    
    console.log('Sample Profile Relationships:');
    const sample = sampleProfileResult.rows[0];
    console.log(`Profile: ${sample.full_name}`);
    console.log(`- Embeddings: ${sample.embedding_count}`);
    console.log(`- Introductions made: ${sample.introductions_made}`);
    console.log(`- Introductions received: ${sample.introductions_received}`);
    console.log(`- Emails logged: ${sample.emails_sent}`);
    console.log(`- Audit entries: ${sample.audit_entries}`);

  } catch (error) {
    console.error('Error verifying test data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyTestData(); 
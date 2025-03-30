const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const testProfiles = [
  {
    full_name: "Sarah Chen",
    email: "sarah.chen@techstartup.co",
    phone: "+64211234567",
    linkedin: "linkedin.com/in/sarahchen",
    location: "Auckland, NZ",
    referral_source: "YCombinator Alumni Network",
    current_plan: "Scaling AI-driven EdTech platform",
    startup_name: "LearnFlow AI",
    cofounders_context: "Solo founder, seeking technical co-founder",
    startup_differentiator: "Personalized learning paths using GPT-4 and custom LLMs",
    startup_validation: "500 beta users, 92% retention rate",
    job_search_preferences: "Not actively looking, focused on startup",
    inspiring_companies: "Duolingo, Khan Academy, OpenAI",
    skillset: "Product Management, Ed Tech, AI/ML",
    additional_interests: "Education reform, AI ethics",
    credibility_score: 8.5
  },
  {
    full_name: "James Wilson",
    email: "james@sustainablefuture.nz",
    phone: "+64221234568",
    linkedin: "linkedin.com/in/jameswilson",
    location: "Wellington, NZ",
    referral_source: "Climate Tech Meetup",
    current_plan: "Developing carbon tracking platform",
    startup_name: "CarbonTrace",
    cofounders_context: "Two co-founders, both environmental scientists",
    startup_differentiator: "Real-time satellite data integration for carbon footprint tracking",
    startup_validation: "Government pilot program approved",
    job_search_preferences: "Open to advisory roles",
    inspiring_companies: "Tesla, Rocket Lab, Wisk Aero",
    skillset: "Environmental Science, Data Analytics",
    additional_interests: "Renewable energy, Space technology",
    credibility_score: 7.8
  },
  {
    full_name: "Aroha Patel",
    email: "aroha@healthtech.nz",
    phone: "+64231234569",
    linkedin: "linkedin.com/in/arohapatel",
    location: "Christchurch, NZ",
    referral_source: "Callaghan Innovation",
    current_plan: "Healthcare accessibility platform",
    startup_name: "KiwiHealth Connect",
    cofounders_context: "Partnership with leading NZ hospitals",
    startup_differentiator: "Integration with NZ health system",
    startup_validation: "DHB pilot successful",
    job_search_preferences: "Seeking healthcare advisors",
    inspiring_companies: "Tend, Eucalyptus, Oscar Health",
    skillset: "Healthcare Administration, Digital Health",
    additional_interests: "Rural healthcare access",
    credibility_score: 9.2
  },
  {
    full_name: "Tom O'Connor",
    email: "tom@agritech.co.nz",
    phone: "+64241234570",
    linkedin: "linkedin.com/in/tomoconnor",
    location: "Hamilton, NZ",
    referral_source: "Farming Innovation Show",
    current_plan: "Smart farming solutions",
    startup_name: "FarmSense",
    cofounders_context: "Family-owned farm background",
    startup_differentiator: "NZ-specific farming algorithms",
    startup_validation: "10 farms in pilot program",
    job_search_preferences: "Looking for technical talent",
    inspiring_companies: "Halter, Robotics Plus",
    skillset: "Agriculture, IoT, Farm Management",
    additional_interests: "Sustainable farming",
    credibility_score: 8.1
  },
  {
    full_name: "Lucy Zhang",
    email: "lucy@fintech.nz",
    phone: "+64251234571",
    linkedin: "linkedin.com/in/lucyzhang",
    location: "Auckland, NZ",
    referral_source: "FinTech NZ",
    current_plan: "Open banking platform",
    startup_name: "KiwiBank Connect",
    cofounders_context: "Ex-banking technology team",
    startup_differentiator: "First open banking API for NZ",
    startup_validation: "Partnership with two banks",
    job_search_preferences: "Seeking finance experts",
    inspiring_companies: "Wise, Stripe, Xero",
    skillset: "Financial Services, API Development",
    additional_interests: "Financial inclusion",
    credibility_score: 8.9
  },
  {
    full_name: "William Tait",
    email: "william@gamedev.nz",
    phone: "+64261234572",
    linkedin: "linkedin.com/in/williamtait",
    location: "Wellington, NZ",
    referral_source: "NZ Game Developers Conference",
    current_plan: "Educational gaming platform",
    startup_name: "PlayLearn Studios",
    cofounders_context: "Team of game developers",
    startup_differentiator: "Māori language learning games",
    startup_validation: "Ministry of Education interest",
    job_search_preferences: "Hiring game designers",
    inspiring_companies: "Ninja Kiwi, PikPok",
    skillset: "Game Development, Unity, Cultural Education",
    additional_interests: "Indigenous education",
    credibility_score: 7.5
  },
  {
    full_name: "Emma Stewart",
    email: "emma@foodtech.nz",
    phone: "+64271234573",
    linkedin: "linkedin.com/in/emmastewart",
    location: "Dunedin, NZ",
    referral_source: "Food Innovation Network",
    current_plan: "Plant-based meat alternatives",
    startup_name: "Pure Proteins",
    cofounders_context: "Food scientist and chef partnership",
    startup_differentiator: "Local NZ ingredients focus",
    startup_validation: "Successful taste tests",
    job_search_preferences: "Looking for food scientists",
    inspiring_companies: "Sunfed, Beyond Meat",
    skillset: "Food Science, R&D, Sustainability",
    additional_interests: "Sustainable agriculture",
    credibility_score: 8.3
  },
  {
    full_name: "David Rangi",
    email: "david@maoritech.nz",
    phone: "+64281234574",
    linkedin: "linkedin.com/in/davidrangi",
    location: "Rotorua, NZ",
    referral_source: "Māori Innovation Network",
    current_plan: "Cultural preservation platform",
    startup_name: "Taonga Digital",
    cofounders_context: "Partnership with iwi leaders",
    startup_differentiator: "AR/VR cultural experiences",
    startup_validation: "Three iwi partnerships",
    job_search_preferences: "Seeking cultural advisors",
    inspiring_companies: "Soul Machines, 8i",
    skillset: "AR/VR Development, Cultural Heritage",
    additional_interests: "Indigenous technology",
    credibility_score: 9.0
  },
  {
    full_name: "Sophie Anderson",
    email: "sophie@cleantech.nz",
    phone: "+64291234575",
    linkedin: "linkedin.com/in/sophieanderson",
    location: "Nelson, NZ",
    referral_source: "Climate Innovation Lab",
    current_plan: "Ocean waste recycling",
    startup_name: "OceanCycle",
    cofounders_context: "Marine biologist partnership",
    startup_differentiator: "Automated waste collection",
    startup_validation: "Local council contract",
    job_search_preferences: "Seeking engineering talent",
    inspiring_companies: "Seabin Project, The Ocean Cleanup",
    skillset: "Marine Biology, Waste Management",
    additional_interests: "Ocean conservation",
    credibility_score: 8.7
  },
  {
    full_name: "Michael Lee",
    email: "michael@retailtech.nz",
    phone: "+64301234576",
    linkedin: "linkedin.com/in/michaellee",
    location: "Tauranga, NZ",
    referral_source: "Retail Innovation Hub",
    current_plan: "AR shopping experience",
    startup_name: "ShopAR",
    cofounders_context: "Retail and tech background",
    startup_differentiator: "Virtual try-on technology",
    startup_validation: "Partnership with major retailer",
    job_search_preferences: "Looking for AR developers",
    inspiring_companies: "Snap, IKEA Place",
    skillset: "Retail Tech, AR Development",
    additional_interests: "Future of retail",
    credibility_score: 7.9
  }
];

async function generateTestData() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Insert profiles and store their IDs
    const profileIds = [];
    for (const profile of testProfiles) {
      const result = await client.query(`
        INSERT INTO profiles (
          full_name, email, phone, linkedin, location, referral_source,
          current_plan, startup_name, cofounders_context, startup_differentiator,
          startup_validation, job_search_preferences, inspiring_companies,
          skillset, additional_interests, credibility_score,
          completed, submitted_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, true, NOW()
        ) RETURNING id
      `, [
        profile.full_name, profile.email, profile.phone, profile.linkedin,
        profile.location, profile.referral_source, profile.current_plan,
        profile.startup_name, profile.cofounders_context, profile.startup_differentiator,
        profile.startup_validation, profile.job_search_preferences,
        profile.inspiring_companies, profile.skillset, profile.additional_interests,
        profile.credibility_score
      ]);
      profileIds.push(result.rows[0].id);
      console.log(`Created profile for ${profile.full_name}`);
    }

    // Generate some AI embeddings
    for (const profileId of profileIds) {
      // Create intro draft
      await client.query(`
        INSERT INTO embeddings (profile_id, type, content, is_edited_by_admin)
        VALUES ($1, 'intro_draft', 'AI-generated introduction draft for this profile', false)
      `, [profileId]);

      // Create intro sought
      await client.query(`
        INSERT INTO embeddings (profile_id, type, content, is_edited_by_admin)
        VALUES ($1, 'intro_sought', 'AI-generated introductions being sought', false)
      `, [profileId]);

      // Create reason to introduce
      await client.query(`
        INSERT INTO embeddings (profile_id, type, content, is_edited_by_admin)
        VALUES ($1, 'reason_to_introduce', 'AI-generated reasons why this person would be valuable to connect with', false)
      `, [profileId]);
    }
    console.log('Created AI embeddings for all profiles');

    // Create some sample introductions
    for (let i = 0; i < profileIds.length - 1; i++) {
      const fromProfileId = profileIds[i];
      const toProfileId = profileIds[i + 1];
      
      // Get an intro draft embedding
      const embedResult = await client.query(
        'SELECT id FROM embeddings WHERE profile_id = $1 AND type = $2 LIMIT 1',
        [fromProfileId, 'intro_draft']
      );
      
      await client.query(`
        INSERT INTO introductions (
          from_profile_id, to_profile_id, status, method, intro_draft_id
        ) VALUES ($1, $2, 'suggested', 'email', $3)
      `, [fromProfileId, toProfileId, embedResult.rows[0].id]);
    }
    console.log('Created sample introductions');

    // Create some email logs
    for (const profileId of profileIds.slice(0, 5)) {
      await client.query(`
        INSERT INTO email_logs (
          profile_id, email_subject, email_body, bcc_logged
        ) VALUES (
          $1, 'Introduction Request', 'Sample email body for introduction request', true
        )
      `, [profileId]);
    }
    console.log('Created sample email logs');

    // Create some audit logs
    for (const profileId of profileIds) {
      await client.query(`
        INSERT INTO audit_logs (
          profile_id, action_type, action_metadata, performed_by
        ) VALUES (
          $1, 'profile_created', $2, 'system'
        )
      `, [profileId, JSON.stringify({ source: "typeform", timestamp: new Date().toISOString() })]);
    }
    console.log('Created audit logs');

    console.log('All test data generated successfully!');
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generateTestData(); 
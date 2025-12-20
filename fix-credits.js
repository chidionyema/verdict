// Quick script to fix user credits
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCredits() {
  try {
    // Find users with negative or null credits
    const { data: users, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .or('credits.lt.0,credits.is.null');

    if (selectError) {
      console.error('Error selecting users:', selectError);
      return;
    }

    console.log(`Found ${users.length} users with negative/null credits:`, users);

    // Update all to have 3 starter credits
    for (const user of users) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: 3 })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error updating user ${user.email}:`, updateError);
      } else {
        console.log(`✅ Fixed credits for ${user.email}: ${user.credits} → 3`);
      }
    }

    console.log('Credit fix complete!');
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixCredits();
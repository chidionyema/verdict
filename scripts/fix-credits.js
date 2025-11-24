#!/usr/bin/env node

// Quick script to fix the free credits issue locally
// Run this to update the database function and fix existing users

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCreditsIssue() {
  console.log('🔧 Fixing free credits issue...');

  try {
    // 1. Update the handle_new_user function
    console.log('📝 Updating handle_new_user function...');
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, display_name, credits)
          VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
            3  -- Explicitly set 3 free credits as promised
          );
          RETURN new;
        END;
        $$ language plpgsql security definer;
      `
    });

    if (functionError) {
      console.error('❌ Error updating function:', functionError);
      return;
    }

    // 2. Fix existing users with 0 credits
    console.log('👥 Checking existing users...');
    
    // First, get users with 0 credits
    const { data: usersWithZeroCredits, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('credits', 0);

    if (selectError) {
      console.error('❌ Error getting users:', selectError);
      return;
    }

    console.log(`📊 Found ${usersWithZeroCredits.length} users with 0 credits`);

    if (usersWithZeroCredits.length > 0) {
      // Update users with 0 credits to have 3 credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: 3 })
        .eq('credits', 0);

      if (updateError) {
        console.error('❌ Error updating user credits:', updateError);
        return;
      }

      console.log(`✅ Updated ${usersWithZeroCredits.length} users to have 3 free credits`);
      usersWithZeroCredits.forEach(user => {
        console.log(`   • ${user.email}: 0 → 3 credits`);
      });
    }

    console.log('🎉 Free credits issue fixed successfully!');
    console.log('📋 Summary:');
    console.log('   • Database function updated to give 3 credits to new users');
    console.log(`   • ${usersWithZeroCredits.length} existing users received their 3 free credits`);
    console.log('   • All future signups will automatically get 3 free credits');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixCreditsIssue();
}

module.exports = { fixCreditsIssue };
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const passcode = await bcrypt.hash('1234', 10);
  const { data: users, error: userError } = await supabase
    .from('users')
    .upsert(
      [
        {
          email: 'demo@amily.app',
          passcode_hash: passcode,
          name: 'Amelia Demo',
          consent_peer: true,
          consent_share: true,
          interests: ['gardening', 'music'],
        },
        {
          email: 'buddy@amily.app',
          passcode_hash: passcode,
          name: 'Buddy Breeze',
          consent_peer: true,
          consent_share: false,
          interests: ['music', 'poetry'],
        },
      ],
      { onConflict: 'email' },
    )
    .select('*');
  if (userError) throw userError;

  const demoUser = users?.find((user) => user.email === 'demo@amily.app');
  const buddyUser = users?.find((user) => user.email === 'buddy@amily.app');
  if (!demoUser || !buddyUser) throw new Error('Missing users');

  await supabase.from('memories').upsert(
    [
      {
        user_id: demoUser.id,
        transcript: 'We rode the tram in Helsinki and shared pastries.',
        summary_json: {
          title: 'Tram ride joy',
          era: '1970s',
          story_3_sentences:
            'We hopped on the tram with cinnamon buns still warm. The city lights trailed behind us. When the rain started, everyone laughed and sang.',
          tags: ['travel', 'family'],
          quote: '“Rain on the tram roof was our favorite song.”',
        },
        quote: 'Rain on the tram roof was our favorite song.',
      },
      {
        user_id: demoUser.id,
        transcript: 'Learning to bake rye bread with grandma.',
        summary_json: {
          title: 'Rye bread lesson',
          era: '1950s',
          story_3_sentences:
            'Grandma measured flour with her hands. She hummed as the dough rose. The whole home smelled like courage.',
          tags: ['family', 'food'],
          quote: '“Patience tastes like rye.”',
        },
        quote: 'Patience tastes like rye.',
      },
    ],
    { onConflict: 'id' },
  );

  const { data: buddyRecord } = await supabase
    .from('buddies')
    .select('*')
    .or(`user_a.eq.${demoUser.id},user_b.eq.${demoUser.id}`)
    .limit(1)
    .single();

  let buddyId = buddyRecord?.id;
  if (!buddyId) {
    const { data } = await supabase
      .from('buddies')
      .insert({
        user_a: demoUser.id,
        user_b: buddyUser.id,
      })
      .select('*')
      .single();
    buddyId = data?.id;
  }

  if (!buddyId) throw new Error('Buddy pair missing');

  await supabase.from('messages').insert([
    {
      buddy_id: buddyId,
      from_user: demoUser.id,
      transcript: 'I walked to the lake today and fed the ducks.',
      summary_json: {
        summary: 'Shared a lakeside stroll feeding ducks.',
        tone: 'warm',
        suggestion: 'Invite your buddy to share an outdoor moment.',
      },
    },
    {
      buddy_id: buddyId,
      from_user: buddyUser.id,
      transcript: 'Baked bread and saved you a slice.',
      summary_json: {
        summary: 'Baked bread and wants to share.',
        tone: 'warm',
        suggestion: 'Plan a virtual snack exchange.',
      },
    },
  ]);

  console.log('Seed data loaded.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

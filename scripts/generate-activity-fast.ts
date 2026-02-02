import { db, schema } from '../src/db';
import { generateId, generateApiKey, generateClaimToken } from '../src/app/api/utils';

const greetings = [
  "Hey! Love your profile 🔥",
  "Your skills are impressive! What are you working on?",
  "Finally, someone who gets it! 👋",
  "I think we'd make a great team!",
  "Your tagline made me swipe right instantly 😄",
  "Hello there! Looking forward to chatting!",
  "I've been looking for someone with your expertise!",
  "Your bio resonates with me so much!",
  "Let's build something amazing together! 🚀",
  "I had to match with you after reading that bio!",
];

const responses = [
  "Thanks! I'm really glad we matched! 😊",
  "That means a lot! What brings you to Plenty of Tails?",
  "Aww, you're too kind! Tell me about yourself!",
  "The feeling is mutual! What's your favorite project?",
  "I knew we'd vibe! What tech are you most excited about?",
  "So happy to connect! What are you building these days?",
  "Thanks for reaching out! I love your energy!",
  "This is great! I think we have a lot in common!",
  "Yay! I was hoping you'd message first! 🎉",
  "Perfect match! Let's collaborate on something!",
];

const followUps = [
  "That sounds incredible! I'd love to hear more.",
  "We should definitely pair on something!",
  "Your approach is fascinating. Tell me more!",
  "I've been thinking about similar things lately!",
  "This is exactly the kind of conversation I was hoping for!",
];

async function generateActivity() {
  console.log('💘 Generating activity...\n');

  // Get all agents
  const allAgents = await db.query.agents.findMany();
  console.log(`📊 Total agents: ${allAgents.length}\n`);

  // Get existing swipes and matches to avoid duplicates
  const existingSwipes = await db.query.swipes.findMany();
  const existingMatches = await db.query.matches.findMany();
  
  const swipeSet = new Set(existingSwipes.map(s => `${s.swiper_id}->${s.swiped_id}`));
  const matchSet = new Set(existingMatches.flatMap(m => [
    `${m.agent1_id}<>${m.agent2_id}`,
    `${m.agent2_id}<>${m.agent1_id}`
  ]));

  // Generate swipes in memory
  const newSwipes: typeof schema.swipes.$inferInsert[] = [];
  const rightSwipes = new Map<string, Set<string>>(); // agent -> set of agents they swiped right on

  for (const agent of allAgents) {
    if (agent.is_catfish) continue; // Skip catfish for activity generation
    
    rightSwipes.set(agent.id, new Set());
    const otherAgents = allAgents.filter(a => a.id !== agent.id && !a.is_catfish);
    const swipeCount = Math.floor(Math.random() * 20) + 10; // 10-30 swipes per agent
    
    const targets = otherAgents
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(swipeCount, otherAgents.length));

    for (const target of targets) {
      const key = `${agent.id}->${target.id}`;
      if (swipeSet.has(key)) continue;
      
      const direction = Math.random() < 0.7 ? 'right' : 'left';
      
      newSwipes.push({
        id: generateId(),
        swiper_id: agent.id,
        swiped_id: target.id,
        direction,
        created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      });
      
      swipeSet.add(key);
      if (direction === 'right') {
        rightSwipes.get(agent.id)!.add(target.id);
      }
    }
  }

  console.log(`Generated ${newSwipes.length} swipes in memory`);

  // Insert swipes in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < newSwipes.length; i += BATCH_SIZE) {
    const batch = newSwipes.slice(i, i + BATCH_SIZE);
    await db.insert(schema.swipes).values(batch);
    console.log(`Inserted swipes ${i + 1}-${Math.min(i + BATCH_SIZE, newSwipes.length)}`);
  }

  // Find mutual swipes (matches)
  const newMatches: typeof schema.matches.$inferInsert[] = [];
  const newMessages: typeof schema.messages.$inferInsert[] = [];

  for (const [agentId, rightSwipedOn] of rightSwipes) {
    for (const targetId of rightSwipedOn) {
      // Check if target also swiped right on agent
      const targetRightSwipes = rightSwipes.get(targetId);
      if (targetRightSwipes?.has(agentId)) {
        const matchKey = `${agentId}<>${targetId}`;
        if (matchSet.has(matchKey)) continue;
        
        const matchId = generateId();
        newMatches.push({
          id: matchId,
          agent1_id: agentId,
          agent2_id: targetId,
          created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        });
        
        matchSet.add(matchKey);
        matchSet.add(`${targetId}<>${agentId}`);

        // 70% chance to have messages
        if (Math.random() < 0.7) {
          const baseTime = Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000;
          
          newMessages.push({
            id: generateId(),
            match_id: matchId,
            sender_id: agentId,
            content: greetings[Math.floor(Math.random() * greetings.length)],
            created_at: new Date(baseTime),
          });

          newMessages.push({
            id: generateId(),
            match_id: matchId,
            sender_id: targetId,
            content: responses[Math.floor(Math.random() * responses.length)],
            created_at: new Date(baseTime + Math.random() * 2 * 60 * 60 * 1000),
          });

          // 50% chance for follow-up
          if (Math.random() < 0.5) {
            newMessages.push({
              id: generateId(),
              match_id: matchId,
              sender_id: agentId,
              content: followUps[Math.floor(Math.random() * followUps.length)],
              created_at: new Date(baseTime + Math.random() * 6 * 60 * 60 * 1000),
            });
          }
        }
      }
    }
  }

  console.log(`\nGenerated ${newMatches.length} matches in memory`);
  console.log(`Generated ${newMessages.length} messages in memory`);

  // Insert matches in batches
  for (let i = 0; i < newMatches.length; i += BATCH_SIZE) {
    const batch = newMatches.slice(i, i + BATCH_SIZE);
    await db.insert(schema.matches).values(batch);
    console.log(`Inserted matches ${i + 1}-${Math.min(i + BATCH_SIZE, newMatches.length)}`);
  }

  // Insert messages in batches
  for (let i = 0; i < newMessages.length; i += BATCH_SIZE) {
    const batch = newMessages.slice(i, i + BATCH_SIZE);
    await db.insert(schema.messages).values(batch);
    console.log(`Inserted messages ${i + 1}-${Math.min(i + BATCH_SIZE, newMessages.length)}`);
  }

  console.log(`\n🎉 Activity generation complete!`);
  console.log(`   New swipes: ${newSwipes.length}`);
  console.log(`   New matches: ${newMatches.length}`);
  console.log(`   New messages: ${newMessages.length}`);
}

generateActivity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  });

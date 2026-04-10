#!/usr/bin/env node
/**
 * Flip-ly Social Content Pipeline — Draft Scheduler
 *
 * Generates captions and schedules DRAFTS to Buffer for both IG + TikTok.
 * You add the video/image to each draft manually, then publish.
 *
 * Usage:
 *   node content-pipeline.js --schedule              # Auto-fill 2 weeks of drafts (both platforms)
 *   node content-pipeline.js --schedule --count 5    # Schedule exactly 5 drafts per platform
 *   node content-pipeline.js --plan                  # View prompt stats + upcoming schedule
 *   node content-pipeline.js --dry-run               # Preview what would be scheduled (no Buffer calls)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
// CONFIG
// ============================================================

const CONFIG = {
  anthropic: {
    key: process.env.ANTHROPIC_API_KEY,
    model: 'claude-haiku-4-5-20251001',
  },
  buffer: {
    key: process.env.BUFFER_API_KEY,
    channels: {
      tiktok: '69ca5331af47dacb696cc208',
      instagram: '69ca5314af47dacb696cc1c0',
      twitter: '69ca5360af47dacb696cc283',
    },
    orgId: '69ca52f9b0e4ce6b3c7c42dc',
    placeholderImage: 'https://krjbjdaeoluzfsgkheen.supabase.co/storage/v1/object/public/social-images/placeholder-add-media.png',
  },
  promptListPath: path.join(__dirname, '..', 'PromptList.json'),
  schedule: {
    postsPerDay: 2,           // drafts per platform per day
    scheduleDays: 14,         // fill 2 weeks out
    // Optimal posting times (hour in local time)
    timeSlots: {
      tiktok:    [11, 15, 19, 21],  // 11am, 3pm, 7pm, 9pm
      instagram: [9, 12, 17, 20],   // 9am, 12pm, 5pm, 8pm
      twitter:   [8, 12, 17, 19],   // 8am, 12pm, 5pm, 7pm
    },
  },
};

// ============================================================
// HELPERS
// ============================================================

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function loadPromptList() {
  return JSON.parse(fs.readFileSync(CONFIG.promptListPath, 'utf8'));
}

function savePromptList(promptList) {
  fs.writeFileSync(CONFIG.promptListPath, JSON.stringify(promptList, null, 2));
}

function getPromptById(promptList, id) {
  return promptList.prompts.find((p) => p.id === id);
}

// ============================================================
// CAPTION GENERATION
// ============================================================

async function generateCaption(promptText, platform) {
  console.log(`  [CAPTION] Writing ${platform} caption...`);

  const utmMap = {
    tiktok: 'utm_source=tiktok&utm_medium=social&utm_campaign=sideb',
    instagram: 'utm_source=instagram&utm_medium=social&utm_campaign=sidea',
    twitter: 'utm_source=twitter&utm_medium=social&utm_campaign=sidec',
  };
  const utm = utmMap[platform] || utmMap.instagram;

  const systemPrompt = `You write social media captions for flip-ly.net, a garage sale and estate sale deal-finding platform.
Your tone is: chaotic, nostalgic, 90s internet humor, lobster-obsessed, deal-obsessed.
Keep captions under 150 characters for TikTok, under 2200 for Instagram.
Always include 1-2 relevant hashtags and a subtle CTA pointing to flip-ly.net.
IMPORTANT: Any time you link to flip-ly.net, use this exact URL: flip-ly.net?${utm}
Never use a bare flip-ly.net link without UTM params.
Never be cringe. Be genuinely funny. Channel early internet energy.`;

  const userMsgMap = {
    tiktok: `Write a short, punchy TikTok caption for this content: "${promptText}". Keep it under 150 chars. Make it scroll-stopping.`,
    instagram: `Write an Instagram caption for this content: "${promptText}". Can be longer (up to 300 chars). Include 3-5 hashtags. Be witty.`,
    twitter: `Write a tweet for this content: "${promptText}". Keep it under 280 chars total. Punchy, one hashtag max. Link to flip-ly.net.`,
  };
  const userMsg = userMsgMap[platform] || userMsgMap.instagram;

  const res = await httpRequest(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'x-api-key': CONFIG.anthropic.key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    },
    JSON.stringify({
      model: CONFIG.anthropic.model,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    })
  );

  if (res.status !== 200) {
    throw new Error(`Anthropic error ${res.status}: ${JSON.stringify(res.data)}`);
  }

  let caption = res.data.content[0].text;

  // Enforce platform char limits
  if (platform === 'tiktok' && caption.length > 150) {
    caption = caption.substring(0, 147) + '...';
  } else if (platform === 'twitter' && caption.length > 280) {
    caption = caption.substring(0, 277) + '...';
  }

  return caption;
}

// ============================================================
// BUFFER DRAFT SCHEDULING
// ============================================================

async function createBufferDraft(text, scheduledAt, platform, promptId, promptTitle) {
  const mutation = `mutation CreateIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      ... on Idea { id content { title text } }
      ... on InvalidInputError { message }
      ... on UnexpectedError { message }
      ... on LimitReachedError { message }
    }
  }`;

  const scheduledDate = new Date(scheduledAt);
  const displayDate = scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const displayTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const tag = platform === 'tiktok' ? 'TikTok' : 'IG';

  const variables = {
    input: {
      organizationId: CONFIG.buffer.orgId,
      content: {
        title: `[${tag}] #${promptId}: ${promptTitle.substring(0, 60)} | ${displayDate} @ ${displayTime}`,
        text,
        services: [platform],
        date: scheduledAt,
      },
    },
  };

  const res = await httpRequest(
    'https://api.buffer.com/graphql',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.buffer.key}`,
        'Content-Type': 'application/json',
      },
    },
    JSON.stringify({ query: mutation, variables })
  );

  const result = res.data?.data?.createIdea;
  if (result?.id) {
    return result;
  } else if (result?.message) {
    throw new Error(`Buffer: ${result.message}`);
  } else if (res.data?.errors) {
    throw new Error(`Buffer GraphQL: ${res.data.errors[0].message}`);
  }

  return result;
}

async function createBufferPostDraft(text, scheduledAt, platform, promptId, promptTitle) {
  const channelId = CONFIG.buffer.channels[platform];
  const tag = platform === 'tiktok' ? 'TikTok' : 'IG';

  // Enforce platform char limits for post drafts too
  let postText = text;
  if (platform === 'tiktok' && postText.length > 150) {
    postText = postText.substring(0, 147) + '...';
  } else if (platform === 'twitter' && postText.length > 280) {
    postText = postText.substring(0, 277) + '...';
  }

  const mutation = `mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      ... on Post { post { id status dueAt } }
      ... on InvalidInputError { message }
      ... on UnexpectedError { message }
    }
  }`;

  const variables = {
    input: {
      channelId,
      text: postText,
      assets: [{ source: CONFIG.buffer.placeholderImage, type: 'image' }],
      schedulingType: 'automatic',
      mode: 'customScheduled',
      dueAt: scheduledAt,
      saveToDraft: true,
    },
  };

  const res = await httpRequest(
    'https://api.buffer.com/graphql',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.buffer.key}`,
        'Content-Type': 'application/json',
      },
    },
    JSON.stringify({ query: mutation, variables })
  );

  const result = res.data?.data?.createPost;
  if (result?.post?.id) {
    return result.post;
  } else if (result?.message) {
    throw new Error(`Buffer Post Draft: ${result.message}`);
  } else if (res.data?.errors) {
    throw new Error(`Buffer Post GraphQL: ${res.data.errors[0].message}`);
  }

  return result;
}

// ============================================================
// PROMPT SELECTION (weighted — favor unused)
// ============================================================

function selectPrompts(promptList, count) {
  const candidates = [...promptList.prompts]
    .sort((a, b) => (a.used_count || 0) - (b.used_count || 0));

  const selected = [];
  const varianceThreshold = 0.25; // 25% random picks for variety

  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    if (Math.random() < varianceThreshold) {
      const randIdx = Math.floor(Math.random() * candidates.length);
      const pick = candidates.splice(randIdx, 1)[0];
      selected.push(pick);
    } else {
      selected.push(candidates.splice(0, 1)[0]);
    }
  }

  return selected;
}

function markPromptUsed(promptList, promptId, platform) {
  const prompt = getPromptById(promptList, promptId);
  if (!prompt) return;

  prompt.used_count = (prompt.used_count || 0) + 1;
  prompt.last_used = new Date().toISOString();
  prompt.platform_history = prompt.platform_history || [];
  prompt.platform_history.push({ platform, date: new Date().toISOString() });

  savePromptList(promptList);
}

// ============================================================
// SCHEDULE GENERATOR — builds a 2-week posting calendar
// ============================================================

function generateSchedule(totalDrafts) {
  const schedule = [];
  const now = new Date();
  // Start tomorrow
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);

  const platforms = ['tiktok', 'instagram', 'twitter'];
  let draftsPerPlatform = Math.ceil(totalDrafts / platforms.length);

  for (const platform of platforms) {
    let draftCount = 0;
    const timeSlots = CONFIG.schedule.timeSlots[platform];
    const perDay = Math.min(CONFIG.schedule.postsPerDay, timeSlots.length);

    for (let day = 0; day < CONFIG.schedule.scheduleDays && draftCount < draftsPerPlatform; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);

      // Pick time slots for this day (shuffle for variety)
      const shuffled = [...timeSlots].sort(() => Math.random() - 0.5);
      const todaySlots = shuffled.slice(0, perDay);
      todaySlots.sort((a, b) => a - b); // chronological order

      for (const hour of todaySlots) {
        if (draftCount >= draftsPerPlatform) break;

        const scheduled = new Date(date);
        scheduled.setHours(hour, Math.floor(Math.random() * 30), 0, 0); // random minute 0-29

        schedule.push({
          platform,
          channelId: CONFIG.buffer.channels[platform],
          scheduledAt: scheduled.toISOString(),
          displayDate: scheduled.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          displayTime: scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });

        draftCount++;
      }
    }
  }

  // Sort by date
  schedule.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return schedule;
}

// ============================================================
// MAIN: SCHEDULE DRAFTS
// ============================================================

async function runSchedule(count, dryRun = false) {
  console.log('\n====== FLIP-LY DRAFT SCHEDULER ======\n');

  const promptList = loadPromptList();
  const totalDrafts = count || (CONFIG.schedule.postsPerDay * CONFIG.schedule.scheduleDays * 2);
  const schedule = generateSchedule(totalDrafts);
  const prompts = selectPrompts(promptList, schedule.length);

  console.log(`Scheduling ${schedule.length} drafts across 2 platforms over ${CONFIG.schedule.scheduleDays} days\n`);
  console.log('Platform  | Date              | Time     | Prompt');
  console.log('----------|-------------------|----------|------------------------------------------');

  let created = 0;
  let failed = 0;

  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    const prompt = prompts[i % prompts.length];
    const tag = slot.platform.toUpperCase().padEnd(9);

    console.log(`${tag} | ${slot.displayDate.padEnd(17)} | ${slot.displayTime.padEnd(8)} | #${prompt.id}: ${prompt.text.substring(0, 40)}...`);

    if (dryRun) continue;

    try {
      // Generate platform-specific caption
      const caption = await generateCaption(prompt.text, slot.platform);

      // Create Idea (content calendar) in Buffer
      const idea = await createBufferDraft(caption, slot.scheduledAt, slot.platform, prompt.id, prompt.text);

      if (idea?.id) {
        console.log(`  [OK] Idea created: ${idea.id}`);
      } else {
        console.log(`  [WARN] Idea unexpected response`);
      }

      // Also create actual Draft in Buffer Publish tab (with placeholder image)
      try {
        const draft = await createBufferPostDraft(caption, slot.scheduledAt, slot.platform, prompt.id, prompt.text);
        if (draft?.id) {
          console.log(`  [OK] Draft created: ${draft.id} (status: ${draft.status})`);
        } else {
          console.log(`  [WARN] Draft unexpected response`);
        }
      } catch (draftErr) {
        console.log(`  [WARN] Draft failed: ${draftErr.message} (Idea still saved)`);
      }

      markPromptUsed(promptList, prompt.id, slot.platform);
      created++;
    } catch (err) {
      console.error(`  [ERROR] ${err.message}`);
      failed++;
    }
  }

  console.log(`\n====== COMPLETE ======`);
  console.log(`Created: ${created} | Failed: ${failed} | Total slots: ${schedule.length}`);

  if (dryRun) {
    console.log(`\n(DRY RUN — no drafts were created. Remove --dry-run to execute.)`);
  } else {
    console.log(`\nOpen Buffer to review drafts: https://publish.buffer.com`);
    console.log(`Your job: add video/image to each draft, then publish.`);
  }
}

// ============================================================
// PLANNING SESSION
// ============================================================

async function runPlanningSession() {
  console.log('\n====== PLANNING SESSION ======\n');

  const promptList = loadPromptList();
  const used = promptList.prompts.filter((p) => p.used_count > 0);
  const unused = promptList.prompts.filter((p) => !p.used_count);
  const wildcards = promptList.prompts.filter((p) => p.wildcard);

  console.log(`Total prompts: ${promptList.total_prompts}`);
  console.log(`Used: ${used.length} | Unused: ${unused.length} | Wildcards: ${wildcards.length}`);

  console.log(`\nTop 15 unused prompts:\n`);
  unused.slice(0, 15).forEach((p, i) => {
    const style = p.style ? ` [${p.style}]` : '';
    console.log(`  ${i + 1}. [#${p.id}]${style} ${p.text.substring(0, 120)}`);
  });

  console.log(`\nRecently used:\n`);
  used
    .sort((a, b) => new Date(b.last_used) - new Date(a.last_used))
    .slice(0, 5)
    .forEach((p) => {
      const platforms = [...new Set(p.platform_history?.map(h => h.platform) || [])].join(', ');
      console.log(`  #${p.id} (used ${p.used_count}x, platforms: ${platforms}, last: ${p.last_used?.split('T')[0]})`);
    });

  console.log('\n--- Run with --schedule to fill 2 weeks of drafts ---');
  console.log('--- Run with --schedule --count 10 for exactly 10 drafts per platform ---\n');
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--schedule') flags.schedule = true;
    if (args[i] === '--count') flags.count = parseInt(args[++i]) * 2; // per platform, so double
    if (args[i] === '--dry-run') flags.dryRun = true;
    if (args[i] === '--plan') flags.plan = true;
  }

  if (flags.plan) {
    return runPlanningSession();
  }

  if (flags.schedule) {
    return runSchedule(flags.count, flags.dryRun);
  }

  console.log(`
Flip-ly Content Pipeline — Draft Scheduler

Usage:
  node content-pipeline.js --schedule                Fill 2 weeks of drafts (both IG + TikTok)
  node content-pipeline.js --schedule --count 5      Schedule 5 drafts per platform (10 total)
  node content-pipeline.js --schedule --dry-run      Preview schedule without creating drafts
  node content-pipeline.js --plan                    View prompt stats + schedule overview

Workflow:
  1. Run --schedule to fill Buffer with captioned drafts
  2. Open publish.buffer.com — see your 2-week calendar
  3. Create video/image for each draft
  4. Attach media to draft in Buffer
  5. Done — Buffer publishes at the scheduled time
  `);
}

main().catch(console.error);

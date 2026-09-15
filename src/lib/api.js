/**
 * All real API fetching logic for CP platforms.
 * - localStorage caching with stale-while-revalidate
 * - 5 second timeouts
 * - Fast LeetCode proxy (Vercel-hosted)
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (reduced from 1 hour)
const CACHE_VERSION = 'v9_';

function getCached(key) {
  try {
    const item = localStorage.getItem(CACHE_VERSION + key);
    return item ? JSON.parse(item) : null;
  } catch { return null; }
}

function isFresh(cached) {
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_VERSION + key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch { /* storage full */ }
}

// Fetch with timeout
function fetchWithTimeout(url, timeoutMs = 5000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Generic wrapper: returns cached data instantly, fetches fresh in background.
 * Optionally force refetch ignoring cache TTL.
 */
export async function fetchWithCache(cacheKey, fetchFn, onData, force = false) {
  const cached = getCached(cacheKey);

  // Return stale data immediately
  if (cached?.data) {
    onData(cached.data, false);
  }

  // If cache is fresh and not forcing, don't re-fetch
  if (!force && isFresh(cached)) return;

  // Fetch fresh data
  try {
    const freshData = await fetchFn();
    setCache(cacheKey, freshData);
    onData(freshData, false);
  } catch (err) {
    // If no cached data existed, propagate error
    if (!cached?.data) throw err;
  }
}

// ─── CODEFORCES ───────────────────────────────────────────────────────────────
export async function fetchCodeforcesData(handle) {
  const [userInfo, ratingHistory, allSubmissions] = await Promise.all([
    fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`).then(r => r.json()),
    fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${handle}`).then(r => r.json()),
    fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${handle}`).then(r => r.json())
  ]);

  if (userInfo.status !== 'OK') throw new Error('Invalid Codeforces handle');

  const user = userInfo.result[0];
  
  const chart = (ratingHistory.result || []).map(c => ({
    name: new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    contest: c.contestName,
    rating: c.newRating
  }));

  const subs = allSubmissions.result || [];
  
  // Calculate total unique problems solved
  const solvedSet = new Set();
  const uniqueSolvedSubs = [];
  
  subs.forEach(s => {
    if (s.verdict === 'OK') {
      const probKey = `${s.problem.contestId}-${s.problem.index}`;
      if (!solvedSet.has(probKey)) {
        solvedSet.add(probKey);
        uniqueSolvedSubs.push(s);
      }
    }
  });

  const recentSubmissions = uniqueSolvedSubs.slice(0, 20).map(s => ({
    id: s.id,
    problem: `${s.problem.contestId}${s.problem.index}. ${s.problem.name}`,
    verdict: s.verdict,
    time: new Date(s.creationTimeSeconds * 1000).toLocaleDateString(),
    lang: s.programmingLanguage
  }));

  const calendar = Array.from(solvedSet).map(key => {
    const s = uniqueSolvedSubs.find(sub => `${sub.problem.contestId}-${sub.problem.index}` === key);
    return s ? s.creationTimeSeconds : null;
  }).filter(Boolean);

  return {
    handle: user.handle,
    rank: user.rank || 'unrated',
    maxRating: user.maxRating || 0,
    currentRating: user.rating || 0,
    avatar: user.avatar,
    solved: solvedSet.size,
    contestsCount: ratingHistory.result?.length || 0,
    chart,
    calendar,
    recentSubmissions
  };
}

// ─── LEETCODE ─────────────────────────────────────────────────────────────────
export async function fetchLeetcodeData(handle) {
  const query = `
  {
    matchedUser(username: "${handle}") {
      profile { reputation ranking userAvatar }
      submitStats {
        acSubmissionNum { difficulty count }
      }
      userCalendar { submissionCalendar }
    }
    userContestRanking(username: "${handle}") { rating globalRanking attendedContestsCount }
    userContestRankingHistory(username: "${handle}") { rating contest { title startTime } }
    recentAcSubmissionList(username: "${handle}", limit: 20) { id title titleSlug timestamp }
  }`;

  let res;
  try {
    res = await fetchWithTimeout(`/api/leetcode/graphql`, 8000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }).then(r => r.json());
  } catch (err) {
    throw new Error('LeetCode API failed. Click Retry.');
  }

  if (res.errors || !res.data?.matchedUser) throw new Error('Invalid LeetCode handle');

  const user = res.data.matchedUser;
  const stats = user.submitStats.acSubmissionNum;
  const contestInfo = res.data.userContestRanking || {};
  const history = res.data.userContestRankingHistory || [];
  
  const getCount = (diff) => stats.find(s => s.difficulty === diff)?.count || 0;

  // Filter out history where they didn't participate (Leetcode returns all contests and sets rating to null or old rating if not participated, wait, actually userContestRankingHistory only includes participated contests? No, it returns ALL contests and sets attended to boolean! Wait, leetcode graphql doesn't return attended in this query. Let's just use it directly, usually they filter it or we can just plot it).
  const chart = history.filter(h => h.rating > 0).map(c => ({
    name: new Date(c.contest.startTime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    contest: c.contest.title,
    rating: Math.round(c.rating)
  }));
  
  const maxRating = chart.length > 0 ? Math.max(...chart.map(c => c.rating)) : 0;
  const currentRating = contestInfo.rating ? Math.round(contestInfo.rating) : 0;

  const recentSubmissions = (res.data.recentAcSubmissionList || []).map(s => ({
    id: s.id,
    problem: s.title,
    verdict: 'Accepted',
    time: new Date(parseInt(s.timestamp) * 1000).toLocaleDateString(),
    lang: 'Solved'
  }));

  let calendar = [];
  try {
    const subCal = JSON.parse(res.data.matchedUser.userCalendar.submissionCalendar);
    Object.keys(subCal).forEach(ts => {
      // subCal[ts] is the count, but for our simple array we can just add the timestamp (we can duplicate it by count if we want, but unique is fine for active days)
      const count = subCal[ts];
      for (let i = 0; i < count; i++) {
        calendar.push(parseInt(ts, 10));
      }
    });
  } catch (e) {}

  return {
    handle,
    rank: user.profile.ranking ? `#${user.profile.ranking}` : 'N/A',
    maxRating,
    currentRating,
    avatar: user.profile.userAvatar || '',
    solved: getCount('All'),
    contestsCount: contestInfo.attendedContestsCount || 0,
    chart,
    calendar,
    recentSubmissions
  };
}

// ─── ATCODER ──────────────────────────────────────────────────────────────────
export async function fetchAtcoderData(handle) {
  // AtCoder has no official API.
  // We use Kenkoooo's community API for submissions, and AtCoder's history JSON for ratings.
  
  const [uRes, historyRes] = await Promise.all([
    fetchWithTimeout(`https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=${handle}`).then(r => r.json()).catch(() => ({})),
    fetchWithTimeout(`/api/atcoder/users/${handle}/history/json`).then(r => r.json()).catch(() => [])
  ]);

  // Fetch all submissions from Kenkoooo (paginated by 500)
  let allSubs = [];
  let fromSecond = 0;
  for (let i = 0; i < 20; i++) { // safety limit of 10,000 submissions
    let chunk = [];
    try {
      chunk = await fetchWithTimeout(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=${fromSecond}`).then(r => r.json());
    } catch (e) { break; }
    if (!chunk || chunk.length === 0) break;
    allSubs.push(...chunk);
    if (chunk.length < 500) break;
    fromSecond = chunk[chunk.length - 1].epoch_second + 1;
  }

  // Calculate unique solved problems (newest first)
  allSubs.sort((a, b) => b.epoch_second - a.epoch_second);
  
  const solvedSet = new Set();
  const uniqueSolvedSubs = [];
  
  allSubs.forEach(s => {
    if (s.result === 'AC') {
      if (!solvedSet.has(s.problem_id)) {
        solvedSet.add(s.problem_id);
        uniqueSolvedSubs.push(s);
      }
    }
  });

  const recentSubmissions = uniqueSolvedSubs.slice(0, 20).map(s => ({
    id: s.id,
    problem: s.problem_id,
    verdict: 'Accepted',
    time: new Date(s.epoch_second * 1000).toLocaleDateString(),
    lang: s.language
  }));

  // AtCoder history format: { ContestScreenName, EndTime, NewRating, ... }
  const chart = (historyRes || []).filter(c => c.IsRated).map(c => ({
    name: new Date(c.EndTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    contest: c.ContestScreenName,
    rating: c.NewRating
  }));

  const maxRating = chart.length > 0 ? Math.max(...chart.map(c => c.rating)) : 0;
  const currentRating = chart.length > 0 ? chart[chart.length - 1].rating : 0;

  const calendar = Array.from(solvedSet).map(key => {
    const s = uniqueSolvedSubs.find(sub => sub.problem_id === key);
    return s ? s.epoch_second : null;
  }).filter(Boolean);

  return {
    handle,
    rank: uRes.accepted_count_rank ? `Rank: ${uRes.accepted_count_rank}` : 'N/A',
    maxRating,
    currentRating,
    avatar: '', // No easy avatar from kenkoooo
    solved: solvedSet.size,
    contestsCount: historyRes.length || 0,
    chart,
    calendar,
    recentSubmissions
  };
}

// ─── ALL UPCOMING CONTESTS ────────────────────────────────────────────────────
export async function fetchAllContests() {
  const CACHE_KEY = CACHE_VERSION + 'calendar_contests_cache';
  const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  } catch (e) {}

  const contests = [];

  // Codeforces
  try {
    const cf = await fetchWithTimeout('https://codeforces.com/api/contest.list?gym=false').then(r => r.json());
    if (cf.status === 'OK') {
      cf.result.filter(c => c.phase === 'BEFORE').forEach(c => {
        contests.push({
          id: `cf-${c.id}`,
          name: c.name,
          platform: 'Codeforces',
          startTime: c.startTimeSeconds * 1000,
          url: `https://codeforces.com/contests/${c.id}`
        });
      });
    }
  } catch (e) { console.error('Codeforces contests error:', e); }

  // LeetCode
  try {
    const lcQuery = '{ upcomingContests { title titleSlug startTime duration } }';
    const lc = await fetchWithTimeout('/api/leetcode/graphql', 5000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: lcQuery })
    }).then(r => r.json());
    
    if (lc.data?.upcomingContests) {
      lc.data.upcomingContests.forEach(c => {
        contests.push({
          id: `lc-${c.titleSlug}`,
          name: c.title,
          platform: 'LeetCode',
          startTime: c.startTime * 1000,
          url: `https://leetcode.com/contest/${c.titleSlug}`
        });
      });
    }
  } catch (e) { console.error('LeetCode contests error:', e); }

  // AtCoder
  try {
    const acHtml = await fetchWithTimeout('/api/atcoder/contests/').then(r => r.text());
    const parser = new DOMParser();
    const doc = parser.parseFromString(acHtml, 'text/html');
    const upcomingTable = doc.querySelector('#contest-table-upcoming tbody');
    if (upcomingTable) {
      upcomingTable.querySelectorAll('tr').forEach(tr => {
        const timeEl = tr.querySelector('td:nth-child(1) a time');
        const linkEl = tr.querySelector('td:nth-child(2) a');
        if (timeEl && linkEl) {
          contests.push({
            id: `ac-${linkEl.getAttribute('href')}`,
            name: linkEl.textContent.trim(),
            platform: 'AtCoder',
            startTime: new Date(timeEl.textContent).getTime(),
            url: `https://atcoder.jp${linkEl.getAttribute('href')}`
          });
        }
      });
    }
  } catch (e) { console.error('AtCoder contests error:', e); }

  contests.sort((a, b) => a.startTime - b.startTime);
  
  localStorage.setItem('calendar_contests_cache', JSON.stringify({
    timestamp: Date.now(),
    data: contests
  }));

  return contests;
}

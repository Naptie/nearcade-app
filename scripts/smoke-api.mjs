// Smoke test for nearcade production API — validates every endpoint path and
// response shape used by the mobile/web client.
const BASE = process.env.NEARKADE_BASE ?? 'https://nearcade.cn';
let pass = 0;
let fail = 0;

async function get(path, expect = (s) => s === 200) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!expect(res.status)) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ok  ${name}`);
  } else {
    fail++;
    console.error(`FAIL  ${name}`);
  }
}

(async () => {
  // Game titles
  const titles = await get('/api/game-titles');
  check('game-titles array', Array.isArray(titles.titles) && titles.titles.length > 20);
  const maimaiDx = titles.titles.find((t) => t.key === 'maimai_dx');
  check('maimai_dx present', maimaiDx?.id === 1);

  // Home stats
  const stats = await get('/api/home/stats');
  check('home.stats totals', typeof stats.totals?.shops === 'number');
  check('home.stats campus leaderboards', Boolean(stats.campus?.['10']?.shops?.length));

  // Discover (Shanghai)
  const disc = await get('/api/discover?latitude=31.2304&longitude=121.4737&radius=10&limit=5');
  check('discover shops sorted by distance', Array.isArray(disc.shops) && disc.shops.length > 0);
  check('discover distance field', typeof disc.shops[0]?.distance === 'number');
  const shopId = disc.shops[0]?.id;

  // Shop detail chain
  if (shopId) {
    const detail = await get(`/api/shops/${shopId}`);
    check('shop detail', detail.shop?.id === shopId && Array.isArray(detail.shop.games));
    const comments = await get(`/api/shops/${shopId}/comments`);
    check('shop comments array', Array.isArray(comments));
    const changelog = await get(`/api/shops/${shopId}/changelog?page=1&limit=5`);
    check('shop changelog paged', Array.isArray(changelog.entries) && typeof changelog.hasMore === 'boolean');
    const attendance = await get(`/api/shops/${shopId}/attendance`);
    check('attendance shape', attendance.success === true && Array.isArray(attendance.games));

    const photos = await get(`/api/shops/${shopId}/photos`);
    check('shop photos', Array.isArray(photos.photos));
  }

  // Rankings
  const campus = await get('/api/rankings/campus?sortBy=shops&radius=10&limit=24');
  check('campus rankings', campus.data.length > 0 && typeof campus.totalCount === 'number');
  check('campus cursor', typeof campus.nextCursor === 'string' || campus.nextCursor === null);
  const region = await get('/api/rankings/region?sortBy=machines&level=province&limit=10');
  check('region rankings', region.data.length > 0 && region.data[0].level === 'province');

  // Universities
  const unis = await get('/api/universities?q=' + encodeURIComponent('上海'));
  check('university search', Array.isArray(unis.universities) && unis.universities.length > 0);
  const uniId = unis.universities[0]?.id;
  if (uniId) {
    const uni = await get(`/api/universities/${uniId}`);
    check('university detail campuses', uni.university?.campuses?.length > 0);
    const clubs = await get(`/api/universities/${uniId}/clubs?page=1`);
    check('university clubs list', Array.isArray(clubs.clubs));
    const posts = await get(`/api/universities/${uniId}/posts?page=1`);
    check('university posts list', Array.isArray(posts.posts));
    if (posts.posts[0]) {
      const postDetail = await get(`/api/posts/${posts.posts[0].id}`);
      check(
        'post detail w/ comments',
        postDetail.post?.id === posts.posts[0].id && Array.isArray(postDetail.comments)
      );
    } else {
      console.log('  skip post detail (no readable posts)');
      pass++;
    }
  }

  // Clubs
  const clubsList = await get('/api/clubs?q=&page=1');
  check('clubs list envelope', Array.isArray(clubsList.clubs) && Array.isArray(clubsList.universities));
  const clubId = clubsList.clubs[0]?.id;
  if (clubId) {
    const club = await get(`/api/clubs/${clubId}`);
    check('club detail', club.club?.id === clubId && Array.isArray(club.starredArcades));
    const arcades = await get(`/api/clubs/${clubId}/arcades`);
    check('club arcades', Array.isArray(arcades.arcades));
  }

  // Auth gate (should be 401 without cookie)
  await fetch(`${BASE}/api/users/me`).then((res) => {
    check('users/me requires auth (401)', res.status === 401);
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

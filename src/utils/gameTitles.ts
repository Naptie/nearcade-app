import type { GameTitle } from '@/api/types';

/**
 * Canonical game-title table from nearcade (src/lib/constants.ts).
 * The live /api/game-titles endpoint is preferred at runtime; this fallback
 * provides ids/keys/seats and accent colors for chips when offline.
 */
export const GAME_TITLES: { id: number; key: string; seats: number; color: string }[] = [
  { id: 1, key: 'maimai_dx', seats: 2, color: '#F45B9C' },
  { id: 2, key: 'maimai', seats: 2, color: '#E874A8' },
  { id: 3, key: 'chunithm', seats: 1, color: '#3EC6E0' },
  { id: 4, key: 'sound_voltex', seats: 1, color: '#8A6BE0' },
  { id: 5, key: 'beatmania_iidx', seats: 2, color: '#5A7BE0' },
  { id: 6, key: 'jubeat', seats: 1, color: '#4CC98A' },
  { id: 7, key: 'nostalgia', seats: 1, color: '#C9A24C' },
  { id: 8, key: 'gd_guitarfreaks', seats: 2, color: '#D05A3A' },
  { id: 9, key: 'gd_drummania', seats: 1, color: '#B04AD0' },
  { id: 10, key: 'dancerush', seats: 2, color: '#40C4B0' },
  { id: 11, key: 'dance_dance_revolution', seats: 2, color: '#E0B23A' },
  { id: 12, key: 'popn_music', seats: 1, color: '#6BC94C' },
  { id: 13, key: 'danceevolution', seats: 2, color: '#E07A4C' },
  { id: 14, key: 'reflec_beat', seats: 2, color: '#4CA8E0' },
  { id: 15, key: 'taiko_no_tatsujin_old', seats: 2, color: '#E05555' },
  { id: 16, key: 'groove_coaster', seats: 1, color: '#9CE04C' },
  { id: 17, key: 'wacca', seats: 1, color: '#E04CB0' },
  { id: 19, key: 'pump_it_up', seats: 2, color: '#4C88E0' },
  { id: 20, key: 'top_star', seats: 1, color: '#D0C040' },
  { id: 21, key: 'djmax_technika', seats: 1, color: '#50B8D0' },
  { id: 22, key: 'percussion_master', seats: 2, color: '#C06840' },
  { id: 23, key: 'danzbase', seats: 2, color: '#6890C8' },
  { id: 24, key: 'project_diva_arcade', seats: 1, color: '#4CD0C0' },
  { id: 27, key: 'ongeki', seats: 1, color: '#E08A4C' },
  { id: 29, key: 'dance_around', seats: 2, color: '#B84CE0' },
  { id: 31, key: 'taiko_no_tatsujin', seats: 2, color: '#E04848' },
  { id: 33, key: 'dance3_evo', seats: 2, color: '#58B868' },
  { id: 34, key: 'jubeat_cn', seats: 1, color: '#48B878' },
];

const byId = new Map(GAME_TITLES.map((t) => [t.id, t]));

export function titleColor(id: number): string {
  return byId.get(id)?.color ?? '#888888';
}

/** Human label for a title: prefers server-provided localized name. */
export function titleName(
  title: Pick<GameTitle, 'id' | 'key' | 'name'> | undefined,
  names: Map<number, string> | undefined
): string {
  if (!title) return '?';
  const live = names?.get(title.id);
  if (live) return prettifyTitle(live);
  return prettifyTitle(title.key);
}

function prettifyTitle(keyOrName: string): string {
  if (keyOrName.includes(' ') || keyOrName.includes('_') === false) {
    // Already a display name like "maimai DX"
    return keyOrName.replace(/_/g, ' ');
  }
  const special: Record<string, string> = {
    maimai_dx: 'maimai DX',
    sound_voltex: 'SOUND VOLTEX',
    beatmania_iidx: 'beatmania IIDX',
    gd_guitarfreaks: 'GuitarFreaks',
    gd_drummania: 'DrumMania',
    dancerush: 'DANCERUSH STARDOM',
    dance_dance_revolution: 'DanceDanceRevolution',
    popn_music: "pop'n music",
    danceevolution: 'DanceEvolution',
    reflec_beat: 'REFLEC BEAT',
    taiko_no_tatsujin_old: 'Taiko no Tatsujin (Old)',
    groove_coaster: 'GROOVE COASTER',
    pump_it_up: 'PUMP IT UP',
    djmax_technika: 'DJMAX Technika',
    project_diva_arcade: 'Project DIVA Arcade',
    ongeki: 'O.N.G.E.K.I.',
    dance_around: 'DANCE aROUND',
    taiko_no_tatsujin: 'Taiko no Tatsujin',
    dance3_evo: 'DANCE³ EVO',
    jubeat_cn: 'jubeat (CN)',
  };
  return special[keyOrName] ?? keyOrName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Sort-criteria options shared by both ranking tabs. */
export function rankingSortOptions(gameTitles: GameTitle[] | undefined): { value: string; title?: string }[] {
  const base = [
    { value: 'shops' },
    { value: 'machines' },
    { value: 'density' },
    { value: 'per_capita' },
  ];
  const games = (gameTitles ?? []).map((t) => ({ value: t.key, title: t.name }));
  return [...base, ...games];
}

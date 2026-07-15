import type { Cadence, MaintenanceTaskDef } from './types';

/**
 * Material-driven lubrication cadence, shared by the enclosed-laser schedules.
 * Wood/Plywood 2 wk · Acrylic 1 wk · Leather 2 wk · Paper 1 day.
 */
const lubeCadence: Cadence = {
  kind: 'time_by_material',
  map: {
    acrylic: { every: 1, unit: 'week' },
    leather: { every: 2, unit: 'week' },
    paper: { every: 1, unit: 'day' },
    wood: { every: 2, unit: 'week' },
  },
};

/**
 * Area-grouped maintenance task catalog. One entry per (task × config-variant); each
 * entry targets models via `models` / `excludeModels`, and `getScheduleForModel`
 * (index.ts) filters + resolves these into a per-model `MaintenanceSchedule`.
 *
 * `helpUrl` is injected per model from `meta.ts`, so entries omit it here. Task copy is
 * de-duplicated in `maintenance.tasks` (ILang); genuinely model-specific copy uses a
 * separate `langKey` (optionally via `langKeyByModel`).
 */
export const maintenanceTasks: MaintenanceTaskDef[] = [
  // ── Panel ──────────────────────────────────────────────────────────────────
  {
    actionType: 'done',
    area: 'panel',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: true,
    excludeModels: ['fpm1'],
    helpArticleIds: {
      ado1: '7670456141071',
      fbb1b: '360001360455',
      fbb1p: '360001360455',
      fbb2: '11162025112079',
      fbm1: '4405229781263',
      fbm2: '13258886683919',
      fhexa1: '4410380017295',
      fhx2rf: '14811360934927',
    },
    id: 'maintain_test',
    langKey: 'maintain_test',
  },
  {
    actionType: 'done',
    area: 'panel',
    cadence: { every: 2, kind: 'time', unit: 'week' },
    essential: false,
    excludeModels: ['fpm1'],
    helpArticleIds: {
      ado1: '7670456141071',
      fbb1b: '360001360455',
      fbb1p: '360001360455',
      fbb2: '11162025112079',
      fbm1: '4405229781263',
      fbm2: '13258886683919',
      fhexa1: '4410380017295',
      fhx2rf: '14811360934927',
    },
    id: 'screen',
    langKey: 'screen',
  },

  // ── Working area ───────────────────────────────────────────────────────────
  {
    actionType: 'done',
    area: 'working_area',
    cadence: lubeCadence,
    essential: false,
    excludeModels: ['fpm1'],
    helpArticleIds: {
      ado1: '7670458214159',
      fbb1b: '360001364836',
      fbb1p: '360001364836',
      fbb2: '11407915503247',
      fbm1: '4405448293391',
      fbm2: '13258878868111',
      fhexa1: '4410380147343',
      fhx2rf: '14811384202895',
    },
    id: 'lube',
    langKey: 'lube',
  },
  // Chassis diverges in cadence: Ador is periodic, CO₂/HEXA-RF is per-operation.
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 2, kind: 'time', unit: 'week' },
    essential: true,
    helpArticleIds: { ado1: '7670456141071' },
    id: 'chassis',
    langKey: 'chassis',
    models: ['ado1'],
  },
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { kind: 'per_operation' },
    essential: true,
    helpArticleIds: {
      fbb2: '11409932004879',
      fbm1: '4405448304399',
      fbm2: '13258807191055',
      fhexa1: '4410372598799',
      fhx2rf: '14811413282831',
    },
    id: 'chassis',
    langKey: 'chassis',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2', 'fhx2rf'],
  },
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { kind: 'per_operation' },
    essential: true,
    helpArticleIds: {
      fbb1b: '5834945223823',
      fbb1p: '5834945223823',
      fbb2: '11409857222927',
      fbm1: '4405448299279',
      fbm2: '13258802809871',
      fhexa1: '4410372533263',
      fhx2rf: '14811400704143',
    },
    id: 'honeycomb',
    langKey: 'honeycomb_table',
    langKeyByModel: { fhx2rf: 'honeycomb_plate' },
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2', 'fhx2rf'],
  },
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { displayKey: 'every_1_2_weeks', every: 2, kind: 'time', unit: 'week' },
    essential: true,
    helpArticleIds: {
      fbb1b: '360001360435',
      fbb1p: '360001360435',
      fbb2: '11149257251727',
      fbm1: '4405448306959',
      fbm2: '13258836792079',
      fhexa1: '4410381229327',
      fhx2rf: '14811399439631',
    },
    id: 'mirrors',
    langKey: 'mirrors_lens',
    langKeyByModel: { fhx2rf: 'mirrors_combiner' },
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2', 'fhx2rf'],
  },
  // Optical diverges: CO₂ is a periodic inspection, HEXA-RF is a check-on-unboxing.
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: true,
    helpArticleIds: {
      fbb1b: '8879968465423',
      fbb1p: '8879968465423',
      fbb2: '11148818804623',
      fbm1: '4405448309391',
      fbm2: '13258745036047',
      fhexa1: '4410373527183',
    },
    id: 'optical',
    langKey: 'optical_inspection',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2'],
  },
  {
    actionType: 'check',
    area: 'working_area',
    cadence: { displayKey: 'upon_unboxing', kind: 'condition' },
    essential: true,
    helpArticleIds: { fhx2rf: '14811392906127' },
    id: 'optical',
    langKey: 'optical_unboxing',
    models: ['fhx2rf'],
  },
  {
    actionType: 'check',
    area: 'working_area',
    cadence: { kind: 'condition' },
    essential: false,
    helpArticleIds: {
      fbb1b: '360001379516',
      fbb1p: '360001379516',
      fbb2: '10993809254671',
      fbm1: '4405448371087',
      fbm2: '13258632564239',
      fhexa1: '4410381633935',
      fhx2rf: '14809382397967',
    },
    id: 'align',
    langKey: 'align',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2', 'fhx2rf'],
  },
  // Door sits in the working area for Ador/CO₂, but the back cover for HEXA-RF (below).
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 2, kind: 'time', unit: 'week' },
    essential: false,
    helpArticleIds: { ado1: '7670456141071', fbm1: '4405448379663', fhexa1: '4410381689103' },
    id: 'door',
    langKey: 'door',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2', 'ado1'],
  },
  // Ventilation fan is in the working area for Ador, the back cover for CO₂ (below).
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: false,
    helpArticleIds: { ado1: '7670455688463' },
    id: 'fan',
    langKey: 'fan',
    models: ['ado1'],
  },
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 1, kind: 'time', unit: 'week' },
    essential: false,
    id: 'worktable',
    langKey: 'worktable',
    models: ['fpm1'],
  },
  {
    actionType: 'done',
    area: 'working_area',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: false,
    id: 'zaxis',
    langKey: 'zaxis',
    models: ['fpm1'],
  },

  // ── Modules (Ador) ─────────────────────────────────────────────────────────
  {
    actionType: 'done',
    area: 'modules',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: true,
    helpArticleIds: { ado1: '7685020681487' },
    id: 'mod_diode',
    langKey: 'mod_diode',
    models: ['ado1'],
  },
  {
    actionType: 'done',
    area: 'modules',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: true,
    helpArticleIds: { ado1: '9538508103823' },
    id: 'mod_ir',
    langKey: 'mod_ir',
    models: ['ado1'],
  },

  // ── Optics (Promark) ───────────────────────────────────────────────────────
  {
    actionType: 'done',
    area: 'optics',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: true,
    id: 'fieldlens',
    langKey: 'fieldlens',
    models: ['fpm1'],
  },

  // ── Back cover ─────────────────────────────────────────────────────────────
  {
    actionType: 'passfail',
    area: 'back_cover',
    cadence: { kind: 'condition' },
    essential: false,
    helpArticleIds: { fbm1: '4405448393743', fhexa1: '4410381909263' },
    id: 'tube',
    langKey: 'tube',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2'],
  },
  {
    actionType: 'done',
    area: 'back_cover',
    cadence: { every: 3, kind: 'time', unit: 'month' },
    essential: true,
    helpArticleIds: {
      fbb1b: '360001364796',
      fbb1p: '360001364796',
      fbb2: '11217964150671',
      fbm1: '4405448396175',
      fbm2: '14128368849935',
      fhexa1: '4410608969359',
    },
    id: 'water',
    langKey: 'water',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2'],
  },
  {
    actionType: 'done',
    area: 'back_cover',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: false,
    helpArticleIds: { fbb1b: '9794099117327', fbb1p: '9794099117327', fbm1: '4405448408719', fhexa1: '4410609061903' },
    id: 'fan',
    langKey: 'fan',
    models: ['fbm1', 'fbb1b', 'fbb1p', 'fhexa1', 'fbb2', 'fbm2'],
  },
  {
    actionType: 'done',
    area: 'back_cover',
    cadence: { every: 2, kind: 'time', unit: 'week' },
    essential: false,
    id: 'door',
    langKey: 'door',
    models: ['fhx2rf'],
  },
  {
    actionType: 'done',
    area: 'back_cover',
    cadence: { every: 1, kind: 'time', unit: 'month' },
    essential: false,
    id: 'exhaust',
    langKey: 'exhaust',
    models: ['fhx2rf'],
  },
];

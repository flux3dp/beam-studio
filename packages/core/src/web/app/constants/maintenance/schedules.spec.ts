import { workAreaSet } from '@core/app/constants/workarea-constants';
import enLang from '@core/app/lang/en';

import { getScheduleForModel } from './index';
import { ALL_SCHEDULED_MODELS, getMaintenanceHelpUrl } from './meta';
import { maintenanceTasks } from './tasks';

const taskStrings = enLang.maintenance.tasks;

describe('maintenance schedules', () => {
  it('maps each model to the expected checklist (by signature task)', () => {
    const idsFor = (model: Parameters<typeof getScheduleForModel>[0]) =>
      getScheduleForModel(model)!.tasks.map((task) => task.id);

    expect(idsFor('fbb2')).toContain('tube'); // CO₂
    expect(idsFor('fbb1b')).toContain('tube'); // CO₂ (Beambox)
    expect(idsFor('fbb1p')).toContain('tube'); // CO₂ (Beambox Pro)
    expect(idsFor('fhx2rf')).toContain('exhaust'); // HEXA RF
    expect(idsFor('fpm1')).toContain('fieldlens'); // Promark
    expect(idsFor('ado1')).toContain('mod_diode'); // Ador
  });

  it('builds a per-model, locale-aware Help Center URL', () => {
    expect(getMaintenanceHelpUrl('fbb2', 'en')).toBe('https://support.flux3dp.com/hc/en-us/articles/11161950590351');
    expect(getMaintenanceHelpUrl('fbm1', 'en')).toBe('https://support.flux3dp.com/hc/en-us/articles/4405229646479');
    expect(getMaintenanceHelpUrl('fbb1b', 'en')).toBe('https://support.flux3dp.com/hc/en-us/articles/11992267769743');
    expect(getMaintenanceHelpUrl('ado1', 'zh-tw')).toBe('https://support.flux3dp.com/hc/zh-tw/articles/9601243693711');
    expect(getMaintenanceHelpUrl('flv1', 'en')).toBeUndefined();
  });

  it('returns undefined for a model without a schedule', () => {
    expect(getScheduleForModel('flv1')).toBeUndefined();
  });

  it('references only valid WorkAreaModel values in the catalog', () => {
    maintenanceTasks.forEach((task) => {
      [...(task.models ?? []), ...(task.excludeModels ?? [])].forEach((model) =>
        expect(workAreaSet.has(model)).toBe(true),
      );
    });
  });

  it('resolves every catalog langKey (and override) to an en.ts string', () => {
    maintenanceTasks.forEach((task) => {
      const keys = [task.langKey, ...Object.values(task.langKeyByModel ?? {})];

      keys.forEach((key) => {
        expect(taskStrings[key].name).toEqual(expect.any(String));
        expect(taskStrings[key].keyPoints).toEqual(expect.any(String));
      });
    });
  });

  describe.each(ALL_SCHEDULED_MODELS)('synthesized schedule for %s', (model) => {
    const schedule = getScheduleForModel(model)!;

    it('has every task area present in areaOrder', () => {
      schedule.tasks.forEach((task) => expect(schedule.areaOrder).toContain(task.area));
    });

    it('gives every task a helpUrl and resolvable langKey', () => {
      schedule.tasks.forEach((task) => {
        expect(task.helpUrl).toEqual(expect.any(String));
        expect(taskStrings[task.langKey].name).toEqual(expect.any(String));
      });
    });
  });

  it('excludes fpm1 from the shared enclosed-laser tasks', () => {
    const promarkIds = getScheduleForModel('fpm1')!.tasks.map((task) => task.id);

    expect(promarkIds).not.toContain('maintain_test');
    expect(promarkIds).not.toContain('screen');
    expect(promarkIds).not.toContain('lube');
  });

  it('applies per-model langKey overrides for HEXA RF vs CO₂', () => {
    const hexa = getScheduleForModel('fhx2rf')!.tasks;
    const co2 = getScheduleForModel('fbb2')!.tasks;

    expect(hexa.find((task) => task.id === 'honeycomb')?.langKey).toBe('honeycomb_plate');
    expect(hexa.find((task) => task.id === 'mirrors')?.langKey).toBe('mirrors_combiner');
    expect(co2.find((task) => task.id === 'honeycomb')?.langKey).toBe('honeycomb_table');
    expect(co2.find((task) => task.id === 'mirrors')?.langKey).toBe('mirrors_lens');
  });

  it('picks the model-specific config variant for divergent tasks', () => {
    const adorChassis = getScheduleForModel('ado1')!.tasks.find((task) => task.id === 'chassis');
    const co2Chassis = getScheduleForModel('fbb2')!.tasks.find((task) => task.id === 'chassis');

    expect(adorChassis?.cadence).toEqual({ every: 2, kind: 'time', unit: 'week' });
    expect(co2Chassis?.cadence).toEqual({ kind: 'per_operation' });
  });
});

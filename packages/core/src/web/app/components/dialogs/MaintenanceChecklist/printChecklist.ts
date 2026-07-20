import dayjs from 'dayjs';

import type { MaintenanceSchedule, MaterialKey } from '@core/app/constants/maintenance';
import i18n from '@core/helpers/i18n';
import { formatCadence, nextDue, statusOf } from '@core/helpers/maintenance/dueStatus';
import type { MachineMaintenanceRecord } from '@core/helpers/maintenance/records';

interface PrintParams {
  machineLabel: string;
  material: MaterialKey;
  record: MachineMaintenanceRecord | undefined;
  schedule: MaintenanceSchedule;
}

const escapeHtml = (str: string): string =>
  str.replace(/[&<>"]/g, (c) => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);

/** Renders the current machine's checklist to a printable window (parity with the paper PDF). */
const printChecklist = ({ machineLabel, material, record, schedule }: PrintParams): void => {
  const t = i18n.lang.maintenance;
  const statusText: Record<string, string> = {
    duesoon: t.legend.due_soon,
    never: t.status.never_done,
    ok: t.legend.up_to_date,
    overdue: t.legend.overdue,
  };

  const rowsByArea = schedule.areaOrder
    .map((area) => {
      const tasks = schedule.tasks.filter((task) => task.area === area);

      if (!tasks.length) return '';

      const rows = tasks
        .map((task) => {
          const taskRecord = record?.tasks[task.id];
          const status = statusOf(taskRecord, task, material, record?.lastUsedAt);
          const due = nextDue(taskRecord, task, material, record?.lastUsedAt);
          const { name } = t.tasks[task.langKey];

          return `<tr>
            <td>${task.essential ? '★ ' : ''}${escapeHtml(name)}</td>
            <td>${escapeHtml(formatCadence(task.cadence, t.cadence))}</td>
            <td>${taskRecord?.lastDoneAt ? dayjs(taskRecord.lastDoneAt).format('YYYY-MM-DD') : '—'}</td>
            <td>${due ? due.format('YYYY-MM-DD') : '—'}</td>
            <td>${statusText[status] ?? ''}</td>
          </tr>`;
        })
        .join('');

      return `<tr class="area"><td colspan="5">${escapeHtml(t.areas[area])}</td></tr>${rows}`;
    })
    .join('');

  const dateStr = dayjs().format('YYYY-MM-DD');
  // The document title is what browsers suggest as the "Save as PDF" filename.
  const documentTitle = `${t.title} - ${machineLabel} - ${dateStr}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
    <title>${escapeHtml(documentTitle)}</title>
    <style>
      body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #1f1f1f; padding: 24px; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .sub { color: #8c8c8c; font-size: 13px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
      th { color: #8c8c8c; font-weight: 500; }
      tr.area td { background: #fafafa; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; }
    </style></head><body>
    <h1>${escapeHtml(t.title)}</h1>
    <div class="sub">${escapeHtml(machineLabel)} · ${dateStr}</div>
    <table><thead><tr>
      <th>${escapeHtml(t.columns.task)}</th><th>${escapeHtml(t.columns.cadence)}</th>
      <th>${escapeHtml(t.status.last)}</th>
      <th>${escapeHtml(t.status.next)}</th><th>${escapeHtml(t.columns.status)}</th>
    </tr></thead><tbody>${rowsByArea}</tbody></table>
    </body></html>`;

  // Print through an off-screen iframe so no separate tab can appear frozen.
  // Kept off-screen (not hidden, which can print blank) and loaded via a Blob URL
  // (more reliable than `srcdoc`); print() is deferred until the content is laid out.
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:0;border:0;';

  // Some environments (e.g. Electron) use the top document's title as the "Save as
  // PDF" filename, so override it during print and restore on cleanup.
  const originalTitle = document.title;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;

    cleaned = true;
    iframe.remove();
    URL.revokeObjectURL(url);
    // Defer a tick; a synchronous restore gets clobbered by the print teardown.
    setTimeout(() => {
      document.title = originalTitle;
    });
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      cleanup();

      return;
    }

    frameWindow.onafterprint = cleanup;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.title = documentTitle;
        frameWindow.focus();
        frameWindow.print();
      }),
    );
  };

  document.body.appendChild(iframe);
  iframe.src = url;
};

export default printChecklist;

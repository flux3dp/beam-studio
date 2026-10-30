import { appendFileSync, globSync, mkdirSync, writeFileSync } from 'node:fs';

// Run from apps/web with Node 24. Keep this glob aligned with cypress.config.ts.
const [shard, total] = process.argv.slice(2).map(Number);

if (!Number.isInteger(shard) || !Number.isInteger(total) || shard < 1 || total < shard) {
  throw new Error('Usage: node scripts/cy-shard.mjs <1-based shard> <total shards>');
}

const allSpecs = globSync('cypress/e2e/**/*.{js,jsx,ts,tsx}')
  .map((file) => file.replaceAll('\\', '/'))
  .sort();
const specs = allSpecs.filter((_, index) => index % total === shard - 1);

// Never hand an empty --spec value to Cypress: it could run the entire suite.
if (specs.length === 0) {
  throw new Error(`Shard ${shard}/${total} has no specs (${allSpecs.length} total)`);
}

if (specs.some((file) => /[,\r\n]/.test(file))) {
  throw new Error('Spec paths must not contain commas or newlines');
}

mkdirSync('cypress/results', { recursive: true });
writeFileSync('cypress/results/specs.json', JSON.stringify(specs, null, 2) + '\n');
console.log(`Shard ${shard}/${total}: ${specs.length}/${allSpecs.length} specs`);
console.log(specs.join('\n'));

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `specs=${specs.join(',')}\n`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Cypress shard ${shard}/${total}\n\n${specs.length} of ${allSpecs.length} specs. ` +
      'Results and failure screenshots are in this job’s artifacts; videos are included when debug artifacts are enabled.\n\n' +
      specs.map((file) => `- \`${file}\``).join('\n') + '\n',
  );
}

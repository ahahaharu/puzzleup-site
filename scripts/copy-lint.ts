// Тексты в коде – строки и JSX-текст с кириллицей в src/ – по тем же правилам, что и content/
// (src/content/text-rules.ts; content/ проверяет pnpm content:check). Плюс типы JSON-LD,
// которых на сайте быть не должно (CLAUDE.md, «Тексты сайта»). Комментарии и тесты не читаются.
// pnpm lint:copy – код выхода 1, если есть нарушения.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const { checkText } = await import('../src/content/text-rules');

// Не текст сайта: сами правила и витрины /dev/* (в production – 404).
const skip = (file: string) =>
  file === 'src/content/text-rules.ts' || file.startsWith('src/app/dev/');
const FORBIDDEN_SCHEMA_TYPES = new Set([
  'Organization',
  'EducationalOrganization',
  'Review',
  'AggregateRating',
  'Rating',
]);
const CYRILLIC = /\p{Script=Cyrillic}/u;

const root = process.cwd();
const findings: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function check(file: string) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const where = (node: ts.Node) =>
    `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node) || ts.isJsxText(node)) {
      if (FORBIDDEN_SCHEMA_TYPES.has(node.text)) {
        findings.push(`${where(node)}  forbidden JSON-LD type «${node.text}»`);
      }
      if (CYRILLIC.test(node.text)) {
        for (const { match, message } of checkText(node.text)) {
          findings.push(`${where(node)}  ${message}: «${match}»`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

for (const full of walk(path.join(root, 'src'))) {
  const file = path.relative(root, full);
  if (/\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !skip(file)) check(file);
}

if (findings.length > 0) {
  console.log(findings.join('\n'));
  process.exit(1);
}

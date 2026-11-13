import { allLegals, allTutors } from 'content-collections';

import faq from '../../content/faq.json';
import reviews from '../../content/reviews.json';
import site from '../../content/site.json';
import situations from '../../content/situations.json';
import subjects from '../../content/subjects.json';
import type { RawContent, SourceFile } from './check';

/**
 * Файлы `content/` как есть, до проверки. MDX читает Content Collections (`content-collections.ts`),
 * JSON импортируется напрямую: у Content Collections корень файла – объект, а здесь массивы.
 */

type MdxDocument = { content: string; mdx: string; _meta: { filePath: string } };

/** Скомпилированное тело MDX по пути файла – его нет в схеме, загрузчик добавляет его после проверки. */
export type MdxByFile = ReadonlyMap<string, string>;

function fromMdx(directory: string, documents: readonly MdxDocument[]) {
  const files: SourceFile[] = [];
  const mdx = new Map<string, string>();
  for (const { _meta, mdx: code, ...data } of documents) {
    const file = `${directory}/${_meta.filePath}`;
    files.push({ file, data });
    mdx.set(file, code);
  }
  return { files, mdx };
}

export function readContent(): { raw: RawContent; mdx: MdxByFile } {
  const tutors = fromMdx('content/tutors', allTutors);
  const legal = fromMdx('content/legal', allLegals);
  return {
    raw: {
      tutors: tutors.files,
      legal: legal.files,
      subjects: { file: 'content/subjects.json', data: subjects },
      reviews: { file: 'content/reviews.json', data: reviews },
      situations: { file: 'content/situations.json', data: situations },
      faq: { file: 'content/faq.json', data: faq },
      site: { file: 'content/site.json', data: site },
    },
    mdx: new Map([...tutors.mdx, ...legal.mdx]),
  };
}

import { defineCollection, defineConfig } from '@content-collections/core';
import { compileMDX } from '@content-collections/mdx';
import { z } from 'zod';

// Content Collections только читает MDX и компилирует тело. Документ, не прошедший схему,
// он молча выбрасывает, поэтому схема здесь нестрогая, а настоящую проверку делает
// src/content (ADR-033): так ошибка в контенте роняет сборку, а не убирает репетитора с сайта.
const mdxFile = z.looseObject({ content: z.string() });

const tutors = defineCollection({
  name: 'tutors',
  directory: 'content/tutors',
  include: '*.mdx',
  schema: mdxFile,
  transform: async (document, context) => ({
    ...document,
    mdx: await compileMDX(context, document),
  }),
});

const legal = defineCollection({
  name: 'legal',
  directory: 'content/legal',
  include: '*.mdx',
  schema: mdxFile,
  transform: async (document, context) => ({
    ...document,
    mdx: await compileMDX(context, document),
  }),
});

export default defineConfig({ content: [tutors, legal] });

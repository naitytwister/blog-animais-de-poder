import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: z.object({
      title: z.string().max(100),
      description: z.string().min(50).max(160),
      subnicho: z.enum([
        'guia-completo',
        'enciclopedia-animal',
        'sonhos-e-sinais',
        'xamanismo-e-tradicoes',
        'ferramentas-e-quiz',
      ]),
      palavra_chave: z.string(),
      tipo: z.enum(['pilar', 'cluster']),
      pilar_slug: z.string().nullish(),
      data: z.coerce.date(),
      imagem_capa: z.string(),
      imagem_alt: z.string(),
      imagem_legenda: z.string().optional(),
      imagem_fonte_url: z.string().optional(),
      arquetipo_narrativo: z.enum([
        'diario-campo',
        'guia-pratico',
        'dossie-etnografico',
        'ensaio-arquetipico',
      ]).optional(),
      autor: z.string().default('Cecília Aranha'),
    }),
  }),
};

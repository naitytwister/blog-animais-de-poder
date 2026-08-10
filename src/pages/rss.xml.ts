import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/consts';

const posts = (await getCollection('posts')).sort(
  (a, b) => b.data.data.valueOf() - a.data.data.valueOf(),
);

export const GET = () =>
  rss({
    title: SITE.name,
    description: SITE.description,
    site: SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.data,
      link: `/posts/${post.id}/`,
      categories: [post.data.subnicho],
    })),
    customData: `<language>pt-br</language>`,
  });

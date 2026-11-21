import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';

import { getMDXComponents } from '../../components/mdx';
import { layoutOptions } from '../../layout-options';
import { source } from '../../source';

export const Route = createFileRoute('/docs/$')({
  loader: ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? [];
    const page = source.getPage(slugs);
    if (!page) throw notFound();
    return {
      slugs,
      title: page.data.title,
      description: page.data.description,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData && [
      { title: `${loaderData.title} | Soundor Icons` },
      { name: 'description', content: loaderData.description },
    ],
  }),
  component: Documentation,
});

function Documentation() {
  const { slugs, title, description } = Route.useLoaderData();
  const page = source.getPage(slugs)!;
  const Content = page.data.body;
  return (
    <DocsLayout
      {...layoutOptions}
      // The page tree lists the docs, starting with Getting started: a Docs
      // link above it would repeat it.
      links={layoutOptions.links.filter(
        (link) => link.url !== '/docs' && link.url !== '/docs/changelog',
      )}
      tree={source.getPageTree()}
      sidebar={{ tabs: false }}
    >
      <DocsPage toc={page.data.toc}>
        <DocsTitle>{title}</DocsTitle>
        <DocsDescription>{description}</DocsDescription>
        <DocsBody>
          <Content components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

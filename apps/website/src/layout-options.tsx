import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// The repository's brand files, which the README shows too.
import logoDark from '../../../assets/brand/soundor-icons-logo-dark-bg.svg?url';
import logo from '../../../assets/brand/soundor-icons-logo.svg?url';

export const layoutOptions = {
  nav: {
    title: (
      <>
        {/* The wordmark is outlined in the theme's ink: one file per theme. */}
        <img
          src={logo}
          alt="Soundor Icons"
          height={36}
          className="h-9 w-auto dark:hidden"
        />
        <img
          src={logoDark}
          alt="Soundor Icons"
          height={36}
          className="hidden h-9 w-auto dark:block"
        />
      </>
    ),
  },
  githubUrl: 'https://github.com/soundor/icons',
  links: [
    { text: 'Docs', url: '/docs' },
    {
      text: 'Components',
      url: 'https://components.soundor.dev/',
      external: true,
    },
    { text: 'Soundor', url: 'https://soundor.dev/', external: true },
  ],
} satisfies BaseLayoutProps;

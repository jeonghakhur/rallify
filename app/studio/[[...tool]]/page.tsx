/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamic import로 클라이언트에서만 렌더링
const NextStudio = dynamic(
  () =>
    import('next-sanity/studio').then((mod) => ({ default: mod.NextStudio })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
        }}
      >
        Studio 로딩 중...
      </div>
    ),
  }
);

import config from '../../../sanity.config';
// export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  // const session = await getServerSession(authOptions);
  // console.log(session);
  // const user = session?.user;
  // console.log('user', user);
  // if (!user) {
  //   return new Response('Authentication Error', { status: 401 });
  // }

  return <NextStudio config={config} />;
}

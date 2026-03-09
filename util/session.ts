import { AuthUser } from '@/model/user';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';

export async function withSessionUser(
  handler: (user: AuthUser) => Promise<Response>
): Promise<Response> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const level = session.level;

  if (level < 1) {
    return new Response('Authentication Error', { status: 401 });
  }

  return handler(user);
}

import { AuthUser } from '@/model/user';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function withSessionUser(
  handler: (user: AuthUser) => Promise<Response>,
  options?: { requiredRole?: 'SUPER_ADMIN' }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const role = user?.role ?? 'PENDING';

  if (!user || role === 'PENDING') {
    return new Response('Authentication Error', { status: 401 });
  }

  if (options?.requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  return handler(user);
}

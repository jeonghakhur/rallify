import { prisma } from '@/lib/prisma';

export async function existingUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function addUser({
  id,
  email,
  name,
  image,
  username,
  provider,
  level,
  gender,
  phone_number,
  birthday,
  birthyear,
}: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  username: string;
  provider: string;
  level?: number;
  gender?: string | null;
  phone_number?: string | null;
  birthday?: string | null;
  birthyear?: string | null;
}) {
  return prisma.user.upsert({
    where: { email },
    create: {
      id,
      email,
      name,
      image,
      username,
      provider,
      level: level ?? 1,
      gender,
      phoneNumber: phone_number,
      birthday,
      birthyear,
    },
    update: {},
  });
}

export async function getAllMembers() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
  return users.map((u) => ({ ...u, id: u.id }));
}

export async function getUserByUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function updateUserById(
  id: string,
  updatedData: Partial<{
    name: string;
    image: string;
    gender: string;
    phoneNumber: string;
    birthday: string;
    birthyear: string;
    address: string;
    level: number;
  }>
) {
  return prisma.user.update({
    where: { id },
    data: updatedData,
  });
}

export async function searchUsers(keyword?: string) {
  const users = await prisma.user.findMany({
    where: keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { username: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      image: true,
      username: true,
    },
  });
  return users.map((u) => ({
    id: u.id,
    image: u.image,
    userName: u.username,
    following: 0,
    followers: 0,
  }));
}

export async function getUserForProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      image: true,
      name: true,
      username: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    image: user.image,
    name: user.name,
    userName: user.username,
    following: 0,
    followers: 0,
    posts: 0,
  };
}

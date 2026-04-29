import { prisma } from '@/lib/prisma';
import { encryptField, decryptField } from '@/util/encryption';

type SensitiveUser = {
  phoneNumber?: string | null;
  birthday?: string | null;
  birthyear?: string | null;
  address?: string | null;
  [key: string]: unknown;
};

function decryptSensitiveFields<T extends SensitiveUser>(user: T): T {
  return {
    ...user,
    phoneNumber: decryptField(user.phoneNumber),
    birthday: decryptField(user.birthday),
    birthyear: decryptField(user.birthyear),
    address: decryptField(user.address),
  };
}

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

export async function createEmailUser(data: {
  email: string;
  password: string;
  name: string;
  gender: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      gender: data.gender,
      username: data.email.split('@')[0],
      provider: 'email',
      level: 0,
      role: 'PENDING',
    },
  });
}

export async function getPendingMembers() {
  return prisma.user.findMany({
    where: { role: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      level: true,
      provider: true,
      createdAt: true,
    },
  });
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function getAllMembers() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
  return users.map((u) => decryptSensitiveFields(u));
}

export async function getUserByUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return decryptSensitiveFields(user);
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
    role: string;
  }>
) {
  const { phoneNumber, birthday, birthyear, address, ...rest } = updatedData;
  const encryptedData = {
    ...rest,
    ...(phoneNumber !== undefined && {
      phoneNumber: encryptField(phoneNumber),
    }),
    ...(birthday !== undefined && { birthday: encryptField(birthday) }),
    ...(birthyear !== undefined && { birthyear: encryptField(birthyear) }),
    ...(address !== undefined && { address: encryptField(address) }),
  };
  return prisma.user.update({
    where: { id },
    data: encryptedData,
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

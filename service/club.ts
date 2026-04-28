import { prisma } from '@/lib/prisma';

// ─── 클럽 CRUD ───

export async function createClub(
  userId: string,
  data: {
    name: string;
    description?: string;
    city?: string;
    district?: string;
    joinType?: string;
  }
) {
  const club = await prisma.club.create({
    data: {
      name: data.name,
      ...(data.description && { description: data.description }),
      ...(data.city && { city: data.city }),
      ...(data.district && { district: data.district }),
      joinType: data.joinType || 'APPROVAL',
      createdBy: userId,
    },
  });

  // 생성자를 OWNER로 자동 등록
  await prisma.clubMember.create({
    data: {
      clubId: club.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  return club;
}

export async function getClubs() {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      creator: { select: { name: true } },
    },
  });
  return clubs.map((c) => ({
    ...c,
    memberCount: c._count.members,
    creatorName: c.creator.name,
    _count: undefined,
    creator: undefined,
  }));
}

export async function getClubById(clubId: string, userId?: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      creator: { select: { name: true } },
      _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
  if (!club) return null;

  let myMembership = null;
  if (userId) {
    myMembership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
    });
  }

  return {
    ...club,
    memberCount: club._count.members,
    creatorName: club.creator.name,
    myMembership,
    _count: undefined,
    creator: undefined,
  };
}

export async function updateClub(
  clubId: string,
  data: {
    name?: string;
    description?: string;
    city?: string;
    district?: string;
    joinType?: string;
    maxMembers?: number | null;
  }
) {
  return prisma.club.update({
    where: { id: clubId },
    data,
  });
}

export async function softDeleteClub(clubId: string) {
  return prisma.club.update({
    where: { id: clubId },
    data: { isActive: false },
  });
}

export async function reactivateClub(clubId: string) {
  return prisma.club.update({
    where: { id: clubId },
    data: { isActive: true },
  });
}

export async function hardDeleteClub(clubId: string) {
  return prisma.club.delete({ where: { id: clubId } });
}

// ─── 멤버십 ───

export async function joinClub(
  clubId: string,
  userId: string,
  introduction?: string
) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club || !club.isActive) throw new Error('클럽을 찾을 수 없습니다.');

  if (club.joinType === 'INVITE_ONLY') {
    throw new Error('초대를 통해서만 가입할 수 있습니다.');
  }

  // 정원 체크
  if (club.maxMembers) {
    const activeCount = await prisma.clubMember.count({
      where: { clubId, status: 'ACTIVE' },
    });
    if (activeCount >= club.maxMembers) {
      throw new Error('클럽 정원이 초과되었습니다.');
    }
  }

  const isOpen = club.joinType === 'OPEN';

  return prisma.clubMember.create({
    data: {
      clubId,
      userId,
      role: 'MEMBER',
      status: isOpen ? 'ACTIVE' : 'PENDING',
      ...(introduction && { introduction }),
      ...(isOpen && { joinedAt: new Date() }),
    },
  });
}

export async function inviteMember(
  clubId: string,
  targetUserId: string,
  invitedBy: string,
  role: string = 'MEMBER'
) {
  return prisma.clubMember.create({
    data: {
      clubId,
      userId: targetUserId,
      role,
      status: 'INVITED',
      invitedBy,
    },
  });
}

export async function respondToInvitation(
  memberId: string,
  userId: string,
  accept: boolean
) {
  const member = await prisma.clubMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.userId !== userId || member.status !== 'INVITED') {
    throw new Error('유효하지 않은 초대입니다.');
  }

  if (accept) {
    return prisma.clubMember.update({
      where: { id: memberId },
      data: { status: 'ACTIVE', joinedAt: new Date() },
    });
  } else {
    return prisma.clubMember.delete({ where: { id: memberId } });
  }
}

export async function approveMember(memberId: string) {
  return prisma.clubMember.update({
    where: { id: memberId },
    data: { status: 'ACTIVE', joinedAt: new Date() },
  });
}

export async function rejectMember(memberId: string, reason?: string) {
  return prisma.clubMember.update({
    where: { id: memberId },
    data: { status: 'REJECTED', ...(reason && { statusReason: reason }) },
  });
}

export async function removeMember(memberId: string, reason?: string) {
  return prisma.clubMember.update({
    where: { id: memberId },
    data: { status: 'REMOVED', ...(reason && { statusReason: reason }) },
  });
}

export async function leaveClub(memberId: string, userId: string) {
  const member = await prisma.clubMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.userId !== userId) {
    throw new Error('멤버를 찾을 수 없습니다.');
  }
  if (member.role === 'OWNER') {
    throw new Error(
      '클럽 소유자는 탈퇴할 수 없습니다. 소유권을 이전하거나 클럽을 삭제해주세요.'
    );
  }
  return prisma.clubMember.update({
    where: { id: memberId },
    data: { status: 'LEFT' },
  });
}

export async function updateMemberRole(memberId: string, newRole: string) {
  const member = await prisma.clubMember.findUnique({
    where: { id: memberId },
  });
  if (!member) throw new Error('멤버를 찾을 수 없습니다.');
  if (member.role === 'OWNER')
    throw new Error('소유자 역할은 변경할 수 없습니다.');
  if (!['MEMBER', 'MANAGER'].includes(newRole))
    throw new Error('유효하지 않은 역할입니다.');

  return prisma.clubMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

export async function getClubMembers(clubId: string, status?: string) {
  return prisma.clubMember.findMany({
    where: { clubId, ...(status ? { status } : {}) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getMyClubs(userId: string) {
  const memberships = await prisma.clubMember.findMany({
    where: { userId, status: { in: ['ACTIVE', 'PENDING', 'INVITED'] } },
    include: {
      club: {
        include: {
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.club,
    memberCount: m.club._count.members,
    myRole: m.role,
    myStatus: m.status,
    memberId: m.id,
    _count: undefined,
  }));
}

// ─── 권한 체크 ───

export async function getClubRole(clubId: string, userId: string) {
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (!member || member.status !== 'ACTIVE') return null;
  return member.role;
}

export async function isClubAdmin(clubId: string, userId: string) {
  const role = await getClubRole(clubId, userId);
  return role === 'OWNER' || role === 'MANAGER';
}

import { ScheduleFormType } from '@/model/schedule';
import { prisma } from '@/lib/prisma';

const scheduleInclude = {
  author: true,
  courtNumbers: true,
  attendees: { include: { user: true } },
  comments: { include: { author: true } },
  gameResult: true,
} as const;

export async function getSchedule(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: scheduleInclude,
  });
  if (!schedule) return null;
  return {
    ...schedule,
    comments: schedule.comments.map((c) => ({
      _key: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      author: {
        _ref: c.authorId,
        name: c.author.name,
        username: c.author.username,
        image: c.author.image,
      },
    })),
  };
}

export async function getAllSchedule() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { date: 'desc' },
    include: {
      gameResult: { select: { id: true } },
      _count: { select: { attendees: true } },
    },
  });
  return schedules.map((s) => ({
    ...s,
    id: s.id,
    hasGameResult: !!s.gameResult,
    gameResultId: s.gameResult?.id ?? null,
    gameResultCount: s.gameResult ? 1 : 0,
  }));
}

export async function createSchedule(
  userId: string,
  scheduleData: ScheduleFormType
) {
  const {
    date,
    startTime,
    endTime,
    courtName,
    courtCount,
    courtNumbers,
    status,
  } = scheduleData;

  return prisma.schedule.create({
    data: {
      date,
      startTime,
      endTime,
      courtName,
      courtCount,
      status: status || 'pending',
      authorId: userId || undefined,
      courtNumbers: {
        create: (courtNumbers || []).map((cn) => ({
          number: cn.number,
          startTime: cn.startTime,
          endTime: cn.endTime,
        })),
      },
    },
    include: scheduleInclude,
  });
}

export async function updateSchedule(
  scheduleId: string,
  updateData: Partial<ScheduleFormType>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { courtNumbers, attendees, ...rest } = updateData;

  return prisma.$transaction(async (tx) => {
    if (courtNumbers) {
      await tx.courtNumber.deleteMany({ where: { scheduleId } });
      await tx.courtNumber.createMany({
        data: courtNumbers.map((cn) => ({
          scheduleId,
          number: cn.number,
          startTime: cn.startTime,
          endTime: cn.endTime,
        })),
      });
    }
    return tx.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(rest.date && { date: rest.date }),
        ...(rest.startTime && { startTime: rest.startTime }),
        ...(rest.endTime && { endTime: rest.endTime }),
        ...(rest.courtName && { courtName: rest.courtName }),
        ...(rest.courtCount && { courtCount: rest.courtCount }),
        ...(rest.status && { status: rest.status }),
      },
      include: scheduleInclude,
    });
  });
}

export async function deleteSchedule(id: string) {
  try {
    await prisma.schedule.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

export async function addAttendance(
  scheduleId: string,
  data: {
    name: string;
    gender: string;
    startHour: string;
    startMinute: string;
    endHour: string;
    endMinute: string;
  },
  userId: string
) {
  return prisma.attendee.create({
    data: {
      scheduleId,
      userId: userId || undefined,
      name: data.name,
      gender: data.gender,
      startHour: data.startHour,
      startMinute: data.startMinute,
      endHour: data.endHour,
      endMinute: data.endMinute,
    },
  });
}

export async function updateAttendance(
  _scheduleId: string,
  data: {
    _key: string;
    name: string;
    gender: string;
    startHour: string;
    startMinute: string;
    endHour: string;
    endMinute: string;
  }
) {
  return prisma.attendee.update({
    where: { id: data._key },
    data: {
      name: data.name,
      gender: data.gender,
      startHour: data.startHour,
      startMinute: data.startMinute,
      endHour: data.endHour,
      endMinute: data.endMinute,
    },
  });
}

export async function removeAttendance(
  _scheduleId: string,
  attendeeKey: string
) {
  return prisma.attendee.delete({ where: { id: attendeeKey } });
}

export async function updateScheduleStatus(scheduleId: string, status: string) {
  return prisma.schedule.update({
    where: { id: scheduleId },
    data: { status },
  });
}

export async function getStatsPeriod() {
  return prisma.gameStatsPeriod.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
}

export async function setStatsPeriod(startDate: string, endDate: string) {
  const existing = await prisma.gameStatsPeriod.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  if (existing) {
    return prisma.gameStatsPeriod.update({
      where: { id: existing.id },
      data: { startDate, endDate },
    });
  }
  return prisma.gameStatsPeriod.create({
    data: { startDate, endDate },
  });
}

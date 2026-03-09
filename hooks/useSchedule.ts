/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AttendanceProps,
  GetScheduleProps,
  ScheduleFormType,
} from '@/model/schedule';
import useSWR, { useSWRConfig } from 'swr';

async function addAttendance(scheduleId: string, attendance: AttendanceProps) {
  console.log('addAttendance', scheduleId, attendance);
  return fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId, attendance }),
  }).then((res) => res.json());
}

async function updateAttendance(
  scheduleId: string,
  attendance: AttendanceProps
) {
  return fetch('/api/attendance', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId, attendance }),
  }).then((res) => res.json());
}

async function deleteAttendance(scheduleId: string, attendeeKey: string) {
  return fetch('/api/attendance', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId, attendeeKey }),
  }).then((res) => res.json());
}

async function createSchedule(newSchedule: ScheduleFormType) {
  return fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSchedule),
  }).then((res) => res.json());
}

async function updateSchedule(
  scheduleId: string,
  updateData: ScheduleFormType
) {
  return fetch(`/api/schedule/${scheduleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  }).then((res) => res.json());
}

async function deleteSchedule(scheduleId: string) {
  return fetch(`/api/schedule/${scheduleId}`, {
    method: 'DELETE',
  }).then((res) => res.json());
}

async function addCommentToSchedule(scheduleId: string, comment: any) {
  console.log('📤 코멘트 추가 요청:', { scheduleId, comment });

  try {
    const response = await fetch(`/api/schedule/${scheduleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 코멘트 추가 실패:', errorData);
      throw new Error(errorData.error || '코멘트 추가에 실패했습니다.');
    }

    const result = await response.json();
    console.log('✅ 코멘트 추가 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 코멘트 추가 중 에러:', error);
    throw error;
  }
}

async function removeCommentFromSchedule(
  scheduleId: string,
  commentKey: string
) {
  console.log('🗑️ 코멘트 삭제 요청:', { scheduleId, commentKey });

  try {
    const response = await fetch(`/api/schedule/${scheduleId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 코멘트 삭제 실패:', errorData);
      throw new Error(errorData.error || '코멘트 삭제에 실패했습니다.');
    }

    const result = await response.json();
    console.log('✅ 코멘트 삭제 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 코멘트 삭제 중 에러:', error);
    throw error;
  }
}

export default function useSchedule(scheduleId?: string) {
  const {
    data: schedule,
    isLoading,
    error,
    mutate,
  } = useSWR<GetScheduleProps>(
    scheduleId ? `/api/schedule/${scheduleId}` : null,
    {
      revalidateOnFocus: false, // 🔹 포커스 시 다시 요청 방지
      revalidateOnReconnect: false, // 🔹 네트워크 변경 시 다시 요청 방지
      // dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      refreshInterval: 10000,
    }
  );
  const { mutate: globalMutate } = useSWRConfig();
  // ✅ 전체 스케줄 목록 가져오기

  const attendees = schedule?.attendees;

  const postAttendance = async (attendance: AttendanceProps) => {
    if (!schedule) return;
    const currentAttendees = schedule.attendees || [];

    const newSchedule = {
      ...schedule,
      attendees: [...currentAttendees, attendance],
    };

    return mutate(
      async () => {
        const response = await addAttendance(scheduleId!, attendance);
        return response; // ✅ 백엔드에서 업데이트된 데이터 반환
      },
      {
        optimisticData: newSchedule,
        rollbackOnError: false, // ❌ 실패 시 이전 상태로 복구
        populateCache: false, // ✅ SWR 캐시 최신 상태 유지
        revalidate: true, // ✅ 불필요한 API 요청 방지
      }
    );
  };

  const patchAttendance = async (attendance: AttendanceProps) => {
    if (!attendees) return;
    const newSchedule = {
      ...schedule,
      attendees: attendees.map((att) =>
        att._key === attendance._key ? { ...att, ...attendance } : att
      ),
    };

    return mutate(
      async () => {
        const response = await updateAttendance(scheduleId!, attendance);
        return response;
      },
      {
        optimisticData: newSchedule,
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      }
    );
  };

  const removeAttendance = async (attendanceKey: string) => {
    if (!attendees) return;

    const updatedAttendees = attendees.filter(
      (att) => att._key !== attendanceKey
    );
    const newSchedule = { ...schedule, attendees: updatedAttendees };

    return mutate(
      async () => {
        const response = await deleteAttendance(scheduleId!, attendanceKey);
        return response;
      },
      {
        optimisticData: newSchedule,
        rollbackOnError: false,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  const postSchedule = async (newSchedule: ScheduleFormType) => {
    console.log('🟢 postSchedule 실행됨', newSchedule);

    try {
      console.log('📤 서버로 데이터 전송 중...');
      const result = await createSchedule(newSchedule);
      console.log('✅ 스케줄 등록 성공!', result);

      // ✅ 서버에서 성공적으로 저장된 후 SWR 캐시를 다시 검증
      console.log('🔄 SWR 캐시 재검증 중...');

      // 즉시 캐시를 무효화하고 새로운 데이터를 가져옴
      await globalMutate('/api/schedule', undefined, { revalidate: true });

      console.log('✅ SWR 캐시 재검증 완료');

      return result;
    } catch (error) {
      console.error('❌ 스케줄 등록 실패:', error);
      throw error;
    }
  };

  const patchSchedule = async (updateData: ScheduleFormType) => {
    console.log('patchSchedule');
    if (!schedule) return;

    const newSchedule = { ...schedule, ...updateData };
    console.log('newSchedule:', newSchedule);

    return mutate(updateSchedule(scheduleId!, updateData), {
      optimisticData: newSchedule as unknown as GetScheduleProps,
      populateCache: false,
      revalidate: false,
      rollbackOnError: true,
    });
  };

  const removeSchedule = async () => {
    console.log('removeSchedule 실행됨');
    const currentSchedules = await globalMutate('/api/schedule');

    globalMutate(
      '/api/schedule',
      currentSchedules?.filter((schedule: any) => schedule.id !== scheduleId), // ✅ 삭제된 데이터를 제외한 새로운 배열 생성
      { revalidate: false } // ✅ 즉시 UI에서 반영하고 API 요청은 나중에 실행
    );
    await deleteSchedule(scheduleId!);

    // ✅ 서버에서 최신 데이터를 가져와 다시 반영
    globalMutate('/api/schedule');
  };

  const addComment = async (comment: any) => {
    if (!schedule) return;

    const newComments = [...(schedule.comments || []), comment];
    const newSchedule = { ...schedule, comments: newComments } as any;

    return mutate(
      async () => {
        const response = await addCommentToSchedule(scheduleId!, comment);
        return response;
      },
      {
        optimisticData: newSchedule,
        rollbackOnError: true,
        populateCache: false,
        revalidate: false,
      }
    );
  };

  const removeComment = async (commentKey: string) => {
    if (!schedule) return;

    const updatedComments = (schedule.comments || []).filter(
      (comment: any) => comment._key !== commentKey
    );
    const newSchedule = { ...schedule, comments: updatedComments } as any;

    return mutate(
      async () => {
        const response = await removeCommentFromSchedule(
          scheduleId!,
          commentKey
        );
        return response;
      },
      {
        optimisticData: newSchedule,
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  return {
    schedule,
    isLoading,
    error,
    postSchedule,
    patchSchedule,
    removeSchedule,
    postAttendance,
    patchAttendance,
    removeAttendance,
    addComment,
    removeComment,
  };
}

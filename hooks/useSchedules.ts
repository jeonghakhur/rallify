import useSWR from 'swr';
import { GetScheduleType } from '@/model/schedule';

// ✅ 전체 스케줄 가져오는 함수
async function fetchSchedules() {
  const response = await fetch('/api/schedule');
  if (!response.ok) {
    throw new Error('스케줄 데이터를 불러오지 못했습니다.');
  }
  return response.json();
}

// ✅ 날짜를 기준으로 정렬하는 함수 (오름차순)
function sortByDate(schedules: GetScheduleType[]) {
  return schedules.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export default function useSchedule() {
  // ✅ SWR에서 데이터를 가져올 때 정렬을 적용
  const {
    data: schedules,
    isLoading,
    error,
    mutate,
  } = useSWR<GetScheduleType[]>(
    '/api/schedule',
    async () => {
      const data = await fetchSchedules();
      return sortByDate(data); // ✅ 데이터 로딩 시 정렬 적용
    },
    {
      revalidateOnFocus: false, // 포커스 시 다시 요청 방지
      revalidateOnReconnect: false, // 네트워크 변경 시 다시 요청 방지
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  // ✅ 새로운 데이터를 가져오거나 추가할 때 항상 정렬 유지
  const refreshSchedules = async () => {
    mutate(
      async () => {
        const newData = await fetchSchedules();
        return sortByDate(newData); // ✅ 새로운 데이터도 정렬 적용
      },
      { revalidate: false }
    );
  };

  return { schedules, isLoading, error, refreshSchedules };
}

export const USER_LEVELS = [
  {
    value: 1,
    label: '일반회원',
    description: '게임/스케줄 조회',
  },
  {
    value: 2,
    label: '우수회원',
    description: '일정 상세 운영 화면 접근',
  },
  {
    value: 3,
    label: '운영진',
    description: '스케줄 생성·게임 결과 편집',
  },
] as const;

export type UserLevel = (typeof USER_LEVELS)[number]['value'];

export function getUserLevelLabel(level: number): string {
  return USER_LEVELS.find((l) => l.value === level)?.label ?? `Lv.${level}`;
}

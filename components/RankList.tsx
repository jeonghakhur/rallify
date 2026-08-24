'use client';

import { useMemo, useState } from 'react';

export type RankRowData = {
  name: string;
  win: number;
  draw: number;
  lose: number;
  game: number;
  point: number;
  winRate: number; // 0~1
  margin: number; // 득점 - 실점 누계
};

export type RankSortKey = 'point' | 'winRate' | 'margin';

type Props = {
  rows: RankRowData[];
  /** 표시할 최대 행 수. 생략하면 전체 표시 */
  limit?: number | undefined;
  startRank?: number;
  onNameClick?: (name: string) => void;
  /** 기본 정렬 기준 (기본값: 승점) */
  defaultSortKey?: RankSortKey;
};

// 9개 열이 모바일에서도 잘리지 않도록 좁은 화면은 압축, md 이상은 여유 있게
const GRID =
  'grid items-center ' +
  'grid-cols-[14px_minmax(48px,1fr)_26px_16px_16px_16px_32px_40px_34px] gap-x-[3px] ' +
  'md:grid-cols-[24px_minmax(120px,1fr)_40px_32px_32px_32px_48px_60px_52px] md:gap-x-2';

// 선택한 기준 우선, 나머지 두 기준으로 동점 처리 (모두 내림차순)
function compareBy(a: RankRowData, b: RankRowData, key: RankSortKey): number {
  switch (key) {
    case 'winRate':
      return b.winRate - a.winRate || b.point - a.point || b.margin - a.margin;
    case 'margin':
      return b.margin - a.margin || b.point - a.point || b.winRate - a.winRate;
    default:
      return b.point - a.point || b.winRate - a.winRate || b.margin - a.margin;
  }
}

const SORTABLE: { key: RankSortKey; label: string }[] = [
  { key: 'point', label: '승점' },
  { key: 'winRate', label: '승률' },
  { key: 'margin', label: '마진' },
];

// 미니멀 랭킹 리스트 — # / 이름(승률 바) / 게임 / 승 / 무 / 패 / 승점 / 승률 / 마진
// 승점·승률·마진 헤더를 누르면 해당 기준으로 정렬 (내림차순)
export default function RankList({
  rows,
  limit,
  startRank = 1,
  onNameClick,
  defaultSortKey = 'point',
}: Props) {
  const [sortKey, setSortKey] = useState<RankSortKey>(defaultSortKey);

  const visibleRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => compareBy(a, b, sortKey));
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }, [rows, sortKey, limit]);

  const activeCol = (key: RankSortKey) =>
    sortKey === key ? 'text-primary dark:text-ball' : '';

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card px-2 md:px-4">
      <div className="min-w-full">
        <div
          className={`${GRID} border-b border-primary/40 py-2.5 text-[9px] font-extrabold uppercase tracking-normal text-muted-foreground dark:border-ball/40 md:text-[10px] md:tracking-[0.1em]`}
        >
          <span>#</span>
          <span>이름</span>
          <span className="text-right">게임</span>
          <span className="text-right">승</span>
          <span className="text-right">무</span>
          <span className="text-right">패</span>
          {SORTABLE.map(({ key, label }) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                aria-pressed={active}
                title={`${label} 기준으로 정렬`}
                className={
                  'whitespace-nowrap text-right transition-colors ' +
                  (active
                    ? 'font-black text-primary dark:text-ball'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                {label}
                <span
                  className={'ml-px text-[8px] ' + (active ? '' : 'opacity-0')}
                >
                  ▾
                </span>
              </button>
            );
          })}
        </div>
        {visibleRows.map((row, idx) => (
          <div
            key={row.name}
            className={`${GRID} border-b border-border/60 py-3 tabular-nums last:border-0`}
          >
            <span className="text-xs font-black text-muted-foreground md:text-sm">
              {startRank + idx}
            </span>
            <span className="min-w-0">
              <button
                type="button"
                onClick={onNameClick ? () => onNameClick(row.name) : undefined}
                className="block max-w-full truncate text-left text-[13px] font-bold text-foreground md:text-[15px]"
              >
                {row.name}
              </button>
              <span className="mt-1 block h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
                <i
                  className="block h-full rounded-full bg-gradient-to-r from-primary to-ball"
                  style={{ width: `${Math.round(row.winRate * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-right text-[11px] font-semibold text-muted-foreground md:text-[13px]">
              {row.game}
            </span>
            <span className="text-right text-[11px] font-bold text-foreground md:text-[13px]">
              {row.win}
            </span>
            <span className="text-right text-[11px] text-muted-foreground md:text-[13px]">
              {row.draw}
            </span>
            <span className="text-right text-[11px] text-muted-foreground md:text-[13px]">
              {row.lose}
            </span>
            <span
              className={
                'text-right text-[14px] font-black md:text-[16px] ' +
                (activeCol('point') || 'text-foreground')
              }
            >
              {row.point}
            </span>
            <span
              className={
                'text-right text-[11px] font-semibold md:text-[13px] ' +
                (activeCol('winRate') || 'text-muted-foreground')
              }
            >
              {(row.winRate * 100).toFixed(1)}%
            </span>
            <span
              className={
                'text-right text-[11px] font-bold md:text-[13px] ' +
                (row.margin > 0
                  ? 'text-primary dark:text-ball'
                  : row.margin < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground')
              }
            >
              {row.margin > 0 ? `+${row.margin}` : row.margin}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

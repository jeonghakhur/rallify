'use client';

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

type Props = {
  rows: RankRowData[];
  startRank?: number;
  onNameClick?: (name: string) => void;
};

const GRID =
  'grid grid-cols-[22px_1fr_auto_44px_54px_48px] items-center gap-x-2';

// 시안의 미니멀 랭킹 리스트 — # / 이름(승률 바) / 전적 / 승점 / 승률 / 마진
// 정렬 기준: 승점 → 승률 → 마진 (calculateStats에서 처리)
export default function RankList({ rows, startRank = 1, onNameClick }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4">
      <div
        className={`${GRID} border-b border-primary/40 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground dark:border-ball/40`}
      >
        <span>#</span>
        <span>이름</span>
        <span className="text-right">전적</span>
        <span className="text-right">승점</span>
        <span className="text-right">승률</span>
        <span className="text-right">마진</span>
      </div>
      {rows.map((row, idx) => (
        <div
          key={row.name}
          className={`${GRID} border-b border-border/60 py-3 tabular-nums last:border-0`}
        >
          <span className="text-sm font-black text-muted-foreground">
            {startRank + idx}
          </span>
          <span className="min-w-0">
            <button
              type="button"
              onClick={onNameClick ? () => onNameClick(row.name) : undefined}
              className="block max-w-full truncate text-left text-[15px] font-bold text-foreground"
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
          <span className="text-right text-xs text-muted-foreground">
            {row.win}-{row.draw}-{row.lose}
            <span className="ml-1 hidden text-muted-foreground/60 sm:inline">
              · {row.game}겜
            </span>
          </span>
          <span className="text-right text-[16px] font-black text-foreground">
            {row.point}
          </span>
          <span className="text-right text-[13px] font-semibold text-muted-foreground">
            {(row.winRate * 100).toFixed(1)}%
          </span>
          <span
            className={
              'text-right text-[13px] font-bold ' +
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
  );
}

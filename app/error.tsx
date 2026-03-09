'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>서버 에러가 발생했습니다.</h1>
      <p>{error.message}</p>
      <button
        onClick={() => reset()} // 상태를 초기화하고 다시 시도
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}

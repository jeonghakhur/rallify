import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>요청하신 페이지가 존재하지 않거나, 삭제되었습니다.</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        홈으로 이동
      </Link>
    </div>
  );
}

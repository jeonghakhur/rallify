import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="print-hidden mt-12 border-t border-border px-6 py-6">
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground hover:underline">
          이용약관
        </Link>
        <Link
          href="/privacy"
          className="font-medium hover:text-foreground hover:underline"
        >
          개인정보처리방침
        </Link>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rallify
      </p>
    </footer>
  );
}

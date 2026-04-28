export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>
      <p className="text-xs text-gray-400 mb-8">
        시행일: 2026년 4월 23일 | 버전 1.0
      </p>

      <section className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <article>
          <h2 className="text-lg font-semibold mb-2">제1조 (목적)</h2>
          <p>
            본 약관은 Rallify(이하 &quot;서비스&quot;)가 제공하는 테니스 클럽
            관리 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및
            책임사항을 규정함을 목적으로 합니다.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">제2조 (용어의 정의)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              &quot;회원&quot;이란 서비스에 가입하여 이용 계약을 체결한 자를
              말합니다.
            </li>
            <li>
              &quot;클럽&quot;이란 회원이 서비스 내에서 생성하거나 가입한 테니스
              동호회를 말합니다.
            </li>
            <li>
              &quot;관리자&quot;란 클럽을 생성하거나 관리 권한을 부여받은 회원을
              말합니다.
            </li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            제3조 (이용 계약의 체결)
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              이용 계약은 회원이 본 약관에 동의하고 가입 신청을 한 후, 서비스가
              이를 승낙함으로써 체결됩니다.
            </li>
            <li>
              서비스는 소셜 로그인(카카오, 네이버, 구글) 또는 이메일 가입을 통해
              회원 가입을 제공합니다.
            </li>
            <li>
              가입 시 본 약관과 개인정보처리방침에 동의한 것으로 간주됩니다.
            </li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">제4조 (서비스의 내용)</h2>
          <p>서비스는 다음과 같은 기능을 제공합니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>테니스 클럽 생성 및 관리</li>
            <li>클럽 회원 초대, 가입 승인 및 관리</li>
            <li>테니스 일정(스케줄) 등록 및 참석 관리</li>
            <li>게임 결과 기록 및 통계</li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">제5조 (회원의 의무)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회원은 정확한 정보를 제공하여야 하며, 타인의 정보를 도용해서는 안
              됩니다.
            </li>
            <li>
              회원은 서비스를 이용하여 법령, 공서양속에 반하는 행위를 해서는 안
              됩니다.
            </li>
            <li>
              회원은 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
            </li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            제6조 (서비스 이용 제한)
          </h2>
          <p>
            서비스는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한
            경우, 사전 통보 없이 서비스 이용을 제한하거나 회원 자격을 박탈할 수
            있습니다.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">제7조 (회원 탈퇴)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              회원은 언제든지 서비스 내 탈퇴 기능을 통해 이용 계약을 해지할 수
              있습니다.
            </li>
            <li>
              탈퇴 시 회원의 개인정보 및 서비스 이용 기록은 즉시 삭제되며,
              복구할 수 없습니다.
            </li>
            <li>
              소유한 클럽이 있는 경우, 클럽을 삭제하거나 소유권을 이전한 후
              탈퇴할 수 있습니다.
            </li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">제8조 (면책 조항)</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              서비스는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에
              대해 책임을 지지 않습니다.
            </li>
            <li>
              서비스는 회원 간 또는 회원과 제3자 간에 발생한 분쟁에 대해
              개입하거나 책임을 지지 않습니다.
            </li>
          </ol>
        </article>
      </section>
    </main>
  );
}

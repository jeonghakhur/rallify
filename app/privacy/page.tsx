export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <p className="text-xs text-gray-400 mb-8">
        시행일: 2026년 4월 23일 | 버전 1.0
      </p>

      <section className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <article>
          <h2 className="text-lg font-semibold mb-2">
            1. 수집하는 개인정보 항목
          </h2>
          <p className="mb-2">
            서비스는 회원가입 및 서비스 이용을 위해 다음 정보를 수집합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>필수 항목</strong>: 이메일, 이름
            </li>
            <li>
              <strong>선택 항목</strong>: 성별, 연락처, 생년월일, 프로필 이미지
            </li>
            <li>
              <strong>소셜 로그인 시 자동 수집</strong>: 소셜 계정 고유 ID,
              이메일, 이름, 프로필 사진
            </li>
          </ul>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            2. 개인정보의 이용 목적
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원 식별 및 본인 확인</li>
            <li>클럽 가입 및 멤버 관리</li>
            <li>테니스 일정 및 게임 결과 관리</li>
            <li>서비스 개선 및 운영</li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p>
            회원의 개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 시 즉시
            파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안
            보관합니다.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            4. 개인정보의 제3자 제공
          </h2>
          <p>
            서비스는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            단, 법령에 의한 요청이 있는 경우에는 예외로 합니다.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            5. 개인정보의 파기 절차 및 방법
          </h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원 탈퇴 시 개인정보는 즉시 삭제됩니다.</li>
            <li>
              전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.
            </li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            6. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              연락처, 생년월일 등 민감 정보는 AES-256-GCM 암호화하여 저장합니다.
            </li>
            <li>비밀번호는 bcrypt로 단방향 해싱하여 저장합니다.</li>
            <li>데이터 전송 시 HTTPS(TLS)를 사용합니다.</li>
          </ul>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">7. 이용자의 권리</h2>
          <p>회원은 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>개인정보 열람, 수정, 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴를 통한 개인정보 일괄 삭제</li>
          </ol>
        </article>

        <article>
          <h2 className="text-lg font-semibold mb-2">
            8. 개인정보 보호 책임자
          </h2>
          <p>
            개인정보 보호에 관한 문의는 아래 연락처로 문의해 주시기 바랍니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스명: Rallify</li>
            <li>이메일: support@rallify.app</li>
          </ul>
        </article>
      </section>
    </main>
  );
}

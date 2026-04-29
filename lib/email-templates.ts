const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 560px;
  margin: 0 auto;
  padding: 24px;
`;

const cardStyle = `
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 24px;
`;

const headingStyle = `font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 16px;`;
const paragraphStyle = `font-size: 14px; color: #4b5563; margin: 0 0 12px;`;
const buttonStyle = `
  display: inline-block;
  background: #3b82f6;
  color: #fff !important;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
`;
const footerStyle = `font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center;`;

const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function wrap(content: string) {
  return `
    <div style="background: #f9fafb; padding: 24px 0;">
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          ${content}
        </div>
        <p style="${footerStyle}">Rallify · 본 메일은 발신 전용입니다.</p>
      </div>
    </div>
  `;
}

export function signupReceivedTemplate(name: string) {
  return {
    subject: '[Rallify] 가입 신청이 접수되었습니다',
    html: wrap(`
      <h1 style="${headingStyle}">가입 신청이 접수되었습니다</h1>
      <p style="${paragraphStyle}"><strong>${name}</strong>님, Rallify에 가입 신청해 주셔서 감사합니다.</p>
      <p style="${paragraphStyle}">관리자 승인 후 서비스를 이용하실 수 있으며, 승인까지 1~2일 정도 소요될 수 있습니다.</p>
      <p style="${paragraphStyle}">승인이 완료되면 별도 메일로 안내해 드립니다.</p>
    `),
  };
}

export function signupApprovedTemplate(name: string) {
  return {
    subject: '[Rallify] 가입이 승인되었습니다',
    html: wrap(`
      <h1 style="${headingStyle}">가입이 승인되었습니다</h1>
      <p style="${paragraphStyle}"><strong>${name}</strong>님, 가입이 승인되었습니다.</p>
      <p style="${paragraphStyle}">이제 로그인하여 Rallify의 모든 서비스를 이용하실 수 있습니다.</p>
      <a href="${siteUrl}/auth/signin" style="${buttonStyle}">로그인하러 가기</a>
    `),
  };
}

export function signupRejectedTemplate(name: string) {
  return {
    subject: '[Rallify] 가입 신청 결과 안내',
    html: wrap(`
      <h1 style="${headingStyle}">가입 신청이 거절되었습니다</h1>
      <p style="${paragraphStyle}"><strong>${name}</strong>님, 안타깝게도 이번 가입 신청은 거절되었습니다.</p>
      <p style="${paragraphStyle}">자세한 사유가 궁금하시거나 재신청을 원하시면 운영팀에 문의해 주세요.</p>
    `),
  };
}

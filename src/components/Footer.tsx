

import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-border/60 bg-muted/30 mt-10" role="contentinfo">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-32 space-y-4">
      {/* 로고 + 패밀리 사이트 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="랩메린이" width={24} height={24} className="w-6 h-6 rounded-lg" />
          <span className="text-sm font-bold">랩메린이</span>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted border border-border/50">
            lab.merini.com
          </span>
        </div>
        {/* merini.com 연동 버튼 */}
        <a
          href="https://merini.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <img src="/icons/icon-home.png" alt="" aria-hidden="true" width={16} height={16} className="w-4 h-4" /> merini.com
          <span className="text-[10px] text-muted-foreground">↗</span>
        </a>
      </div>

      {/* 가이드 링크 */}
      <nav aria-label="가이드 링크" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        <Link to="/guide/symbols" className="text-muted-foreground hover:text-primary transition-colors">해외선물 종목 가이드</Link>
        <Link to="/guide/futures-trading-hours" className="text-muted-foreground hover:text-primary transition-colors">거래시간 (KST)</Link>
        <Link to="/guide/tick-value" className="text-muted-foreground hover:text-primary transition-colors">1틱 가치 총정리</Link>
        <Link to="/calculator" className="text-muted-foreground hover:text-primary transition-colors">손익계산기</Link>
        <Link to="/calendar" className="text-muted-foreground hover:text-primary transition-colors">경제 캘린더</Link>
      </nav>

      <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed space-y-2">
        <p>
          <img src="/icons/icon-warning.png" alt="" aria-hidden="true" width={16} height={16} className="w-4 h-4 inline-block align-middle" /> <strong>면책 조항:</strong> 본 서비스에서 제공하는 시세, 시그널, 분석 정보는 투자 권유가 아니며, 참고 자료로만 활용하시기 바랍니다.
          투자에 따른 손실은 전적으로 투자자 본인에게 있습니다.
        </p>
        <p>
          시세 데이터는 지연될 수 있으며, 실시간 정확성을 보장하지 않습니다.
          중요한 투자 결정은 공인된 금융기관의 정보를 참고하세요.
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        © {new Date().getFullYear()} 랩메린이 (LAB MERINI). All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;

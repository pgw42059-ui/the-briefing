

export const Footer = () => (
  <footer className="border-t border-border/60 bg-muted/30 mt-10" role="contentinfo">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="랩메린이" width={24} height={24} className="w-6 h-6 rounded-lg" />
        <span className="text-sm font-bold">랩메린이</span>
      </div>
      <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed space-y-2">
        <p>
          ⚠️ <strong>면책 조항:</strong> 본 서비스에서 제공하는 시세, 시그널, 분석 정보는 투자 권유가 아니며, 참고 자료로만 활용하시기 바랍니다.
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

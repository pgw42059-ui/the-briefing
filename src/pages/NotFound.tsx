import { useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>페이지를 찾을 수 없습니다 — 랩메린이</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 px-6">
          <SearchX className="w-16 h-16 mx-auto text-muted-foreground/40" />
          <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
          <p className="text-lg text-muted-foreground">요청하신 페이지를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground/70">
            주소가 올바른지 확인하거나, 아래 버튼을 눌러 대시보드로 돌아가세요.
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl gap-2 mt-2">
              <Home className="w-4 h-4" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;

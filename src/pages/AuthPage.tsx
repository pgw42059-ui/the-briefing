import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: '로그인 실패', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: '비밀번호 오류', description: '비밀번호는 6자 이상이어야 합니다', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: displayName || undefined },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '회원가입 완료', description: '이메일을 확인하여 계정을 인증해주세요.' });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Google 로그인 실패', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <img src="/logo.png" alt="더브리핑" width={40} height={40} className="w-10 h-10 rounded-xl" />
            <h1 className="text-2xl font-extrabold tracking-tight">더브리핑</h1>
          </div>
          <p className="text-sm text-muted-foreground">로그인하여 관심종목을 관리하세요</p>
        </div>

        <Card className="rounded-xl">
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              <TabsList className="w-full h-10 rounded-xl bg-muted p-1">
                <TabsTrigger value="login" className="flex-1 rounded-lg text-sm font-semibold">로그인</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 rounded-lg text-sm font-semibold">회원가입</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Login */}
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-semibold gap-2"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">또는</span></div>
              </div>

              {/* Login Form */}
              <TabsContent value="login" className="mt-0 space-y-3">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <label htmlFor="login-email" className="sr-only">이메일 주소</label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="이메일 주소"
                      className="pl-10 h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <label htmlFor="login-password" className="sr-only">비밀번호</label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="비밀번호"
                      className="pl-10 h-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold" disabled={loading}>
                    {loading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup" className="mt-0 space-y-3">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <label htmlFor="signup-name" className="sr-only">닉네임</label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="닉네임 (선택)"
                      className="pl-10 h-11 rounded-xl"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <label htmlFor="signup-email" className="sr-only">이메일 주소</label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="이메일 주소"
                      className="pl-10 h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <label htmlFor="signup-password" className="sr-only">비밀번호</label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="비밀번호 (6자 이상)"
                      className="pl-10 h-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold" disabled={loading}>
                    {loading ? '가입 중...' : '회원가입'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> 대시보드로 돌아가기
        </Button>
      </div>
    </div>
  );
}

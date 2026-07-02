"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockKeyhole, UserRound, Bot, Workflow, Database, Blocks, Shrimp, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FloatingElements() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Connecting Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-30" style={{ filter: 'drop-shadow(0 0 8px rgba(39,115,255,0.3))' }}>
        <path d="M 20% 25% L 80% 25%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" fill="none" />
        <path d="M 20% 25% L 15% 50%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite_reverse]" fill="none" />
        <path d="M 15% 50% L 20% 75%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" fill="none" />
        <path d="M 80% 25% L 80% 75%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" fill="none" />
        <path d="M 20% 75% L 50% 85%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" fill="none" />
        <path d="M 80% 75% L 50% 85%" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite_reverse]" fill="none" />
        <defs>
          <linearGradient id="grad-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2773ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4fd6ff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Nodes */}
      {/* Top Left: Agent */}
      <div className="absolute top-[25%] left-[20%] -translate-x-1/2 -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.15)]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100/50 to-transparent pointer-events-none" />
          <Bot className="w-10 h-10 text-blue-600" />
          <div className="absolute -bottom-8 whitespace-nowrap text-sm font-medium text-blue-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            Agent 智能体
          </div>
        </div>
      </div>

      {/* Top Right: Claw */}
      <div className="absolute top-[25%] left-[80%] -translate-x-1/2 -translate-y-1/2 animate-[float_8s_ease-in-out_infinite_1s]">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.15)]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-100/50 to-transparent pointer-events-none" />
          <Shrimp className="w-10 h-10 text-rose-500" />
          <div className="absolute -bottom-8 whitespace-nowrap text-sm font-medium text-rose-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            Claw
          </div>
        </div>
      </div>

      {/* Middle Left: Data Query */}
      <div className="absolute top-[50%] left-[15%] -translate-x-1/2 -translate-y-1/2 animate-[float_7.5s_ease-in-out_infinite_0.8s]">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.1)]">
          <PieChart className="w-8 h-8 text-amber-500" />
          <div className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-amber-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            智能问数
          </div>
        </div>
      </div>

      {/* Bottom Left: RAG */}
      <div className="absolute top-[75%] left-[20%] -translate-x-1/2 -translate-y-1/2 animate-[float_7s_ease-in-out_infinite_2s]">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.1)]">
          <Database className="w-8 h-8 text-indigo-500" />
          <div className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-indigo-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            知识库 RAG
          </div>
        </div>
      </div>

      {/* Bottom Right: Workflow */}
      <div className="absolute top-[75%] left-[80%] -translate-x-1/2 -translate-y-1/2 animate-[float_9s_ease-in-out_infinite_0.5s]">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.1)]">
          <Workflow className="w-8 h-8 text-cyan-500" />
          <div className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-cyan-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            工作流编排
          </div>
        </div>
      </div>

      {/* Bottom Center: Plugins */}
      <div className="absolute top-[85%] left-[50%] -translate-x-1/2 -translate-y-1/2 animate-[float_6.5s_ease-in-out_infinite_1.5s]">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(39,115,255,0.1)]">
          <Blocks className="w-7 h-7 text-purple-500" />
          <div className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-purple-800/80 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            插件生态
          </div>
        </div>
      </div>

      {/* Decorative glowing orbs */}
      <div className="absolute top-[20%] left-[20%] w-32 h-32 bg-blue-400/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute top-[75%] left-[80%] w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite_1s]" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/claw-hub-next";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "登录失败，请稍后重试");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Visuals & Branding */}
      <div className="relative hidden w-0 flex-1 flex-col justify-center overflow-hidden bg-[#f2f7fd] lg:flex">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-no-repeat opacity-40 mix-blend-multiply"
          style={{ backgroundImage: 'url(/images/login-bg.png)', backgroundPosition: '80% 20%', backgroundSize: '200%' }}
        />
        
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,115,255,0.08),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(79,214,255,0.08),transparent_50%)]" />
        
        <FloatingElements />

        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-8 pointer-events-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <img
                src="/icons/cecloud.png"
                alt="中国电子云"
                className="h-6 w-auto"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900 tracking-wide">中国电子云 · 新星</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-6">
            新星 Agent Foundry <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              企业级智能体开发平台
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
            提供从模型接入、知识库构建、工作流编排到智能体发布的全链路解决方案，助力企业快速落地大模型应用。
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-[500px] xl:w-[600px] lg:flex-none lg:px-20 xl:px-24 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="mx-auto w-full max-w-sm lg:w-full">
          <div className="mb-10 lg:hidden text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_rgba(39,115,255,0.12)] border border-gray-100">
              <img
                src="/icons/cecloud.png"
                alt="中国电子云"
                className="h-8 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">新星 AI 平台</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">欢迎回来</h2>
            <p className="mt-2 text-sm text-gray-500">
              登录您的账号以继续使用平台
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">账号</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="请输入账号"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus-visible:bg-white transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">密码</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus-visible:bg-white transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-[#2773ff] text-white hover:bg-[#1f66eb] shadow-[0_8px_20px_rgba(39,115,255,0.25)] hover:shadow-[0_10px_24px_rgba(39,115,255,0.3)] transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

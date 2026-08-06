import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={`${basePath}/brand/affinity-risk-logo.png`}
            alt="Affinity Risk"
            className="h-10 mx-auto mb-3"
            style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(42%) saturate(789%) hue-rotate(175deg) brightness(91%) contrast(99%)" }}
          />
          <h1 className="text-xl font-bold text-slate-900">Sign in to RiskDrive™</h1>
          <p className="text-sm text-slate-500 mt-1">Affinity Risk Solutions — AAA Towing Network Platform</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
      </div>
    </div>
  );
}

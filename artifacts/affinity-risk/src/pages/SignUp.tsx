import { SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
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
          <h1 className="text-xl font-bold text-slate-900">Request platform access</h1>
          <p className="text-sm text-slate-500 mt-1">Your account will be reviewed by an Affinity Risk admin before activation.</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={`${basePath}/pending`}
        />
      </div>
    </div>
  );
}

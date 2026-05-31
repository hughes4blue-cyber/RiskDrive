import { useEffect, useRef } from "react";
import { ClerkProvider, useUser, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useGetCurrentUser } from "@workspace/api-client-react";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Clubs from "@/pages/Clubs";
import ClubDetail from "@/pages/ClubDetail";
import Facilities from "@/pages/Facilities";
import FacilityDetail from "@/pages/FacilityDetail";
import Drivers from "@/pages/Drivers";
import DriverDetail from "@/pages/DriverDetail";
import Vehicles from "@/pages/Vehicles";
import VehicleDetail from "@/pages/VehicleDetail";
import Accidents from "@/pages/Accidents";
import Certificates from "@/pages/Certificates";
import Training from "@/pages/Training";
import Policies from "@/pages/Policies";
import ClaimsDashboard from "@/pages/ClaimsDashboard";
import FleetScore from "@/pages/FleetScore";
import Settlement from "@/pages/Settlement";
import Onboarding from "@/pages/Onboarding";
import Leaderboard from "@/pages/Leaderboard";
import DriverFeedback from "@/pages/DriverFeedback";
import FinnPage from "@/pages/Finn";
import WCQuote from "@/pages/WCQuote";
import ConnectTelematics from "@/pages/ConnectTelematics";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import PendingApproval from "@/pages/PendingApproval";
import AdminConsole from "@/pages/AdminConsole";
import NotFound from "@/pages/not-found";

/* ── Clerk bootstrap ─────────────────────────────────────────────────
   Copy these three lines verbatim — do NOT inline the env var, do
   NOT gate clerkProxyUrl on NODE_ENV, do NOT use window.location.host
   (includes port in dev). See clerk-auth skill for explanation. */
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — check environment variables");
}

/* ── Branded Clerk appearance ──────────────────────────────────────── */
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#E97132",
    colorForeground: "#1e293b",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#1e293b",
    colorNeutral: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold text-xl",
    headerSubtitle: "text-slate-500 text-sm",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-semibold text-sm",
    footerActionLink: "text-orange-600 hover:text-orange-700 font-semibold",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-orange-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-slate-700",
    logoBox: "flex justify-center py-2",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors",
    formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors",
    formFieldInput: "border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:border-orange-400",
    footerAction: "bg-slate-50 border-t border-slate-100",
    dividerLine: "bg-slate-200",
    alert: "border border-red-200 bg-red-50 rounded-xl",
    otpCodeFieldInput: "border border-slate-200 rounded-xl",
    formFieldRow: "",
    main: "",
  },
};

/* ── React Query client ─────────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

/* ── Cache invalidator (clerk user changes → clear RQ cache) ─────────── */
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

/* ── Auth-aware layout guard ─────────────────────────────────────────
   In Live mode, a signed-in user who is still pending approval sees
   the waiting screen instead of the main app. In Demo mode (or while
   mode/user is loading) everything passes through normally. */
function AuthGate() {
  const { isSignedIn, isLoaded } = useUser();
  const { data: meData } = useGetCurrentUser();

  if (
    isLoaded &&
    isSignedIn &&
    meData?.mode === "live" &&
    meData?.user?.approvalStatus === "pending"
  ) {
    return <PendingApproval />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/clubs" component={Clubs} />
        <Route path="/clubs/:clubId" component={ClubDetail} />
        <Route path="/facilities" component={Facilities} />
        <Route path="/facilities/:facilityId" component={FacilityDetail} />
        <Route path="/drivers" component={Drivers} />
        <Route path="/drivers/:driverId" component={DriverDetail} />
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/vehicles/:vehicleId" component={VehicleDetail} />
        <Route path="/accidents" component={Accidents} />
        <Route path="/certificates" component={Certificates} />
        <Route path="/policies" component={Policies} />
        <Route path="/training" component={Training} />
        <Route path="/fleet-score" component={FleetScore} />
        <Route path="/claims" component={ClaimsDashboard} />
        <Route path="/settlement" component={Settlement} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/driver-feedback" component={DriverFeedback} />
        <Route path="/finn" component={FinnPage} />
        <Route path="/wc-quote" component={WCQuote} />
        <Route path="/connect-telematics" component={ConnectTelematics} />
        <Route path="/admin" component={AdminConsole} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

/* ── Top-level router ───────────────────────────────────────────────── */
function Router() {
  return (
    <Switch>
      {/* REQUIRED: /*? optional wildcard matches Clerk OAuth sub-paths
          like /sign-in/sso-callback. Do NOT use /sign-in/* or :rest* */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/pending-approval" component={PendingApproval} />
      {/* All other routes go through the sidebar layout */}
      <Route component={AuthGate} />
    </Switch>
  );
}

/* ── ClerkProvider (must be inside WouterRouter for useLocation) ─────── */
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to RiskDrive",
            subtitle: "Sign in to your Affinity Risk Solutions account",
          },
        },
        signUp: {
          start: {
            title: "Request platform access",
            subtitle: "Your account will be reviewed by an Affinity Risk admin",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

/* ── App root ──────────────────────────────────────────────────────── */
function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

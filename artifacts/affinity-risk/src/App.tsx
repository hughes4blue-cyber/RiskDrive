import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

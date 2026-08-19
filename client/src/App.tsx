import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Compliance from "@/pages/Compliance";
import ControlCoverage from "@/pages/ControlCoverage";
import ExecutiveSummary from "@/pages/ExecutiveSummary";
import Findings from "@/pages/Findings";
import NotFound from "@/pages/NotFound";
import Overview from "@/pages/Overview";
import RiskTrends from "@/pages/RiskTrends";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function WorkspaceRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/risk-trends" component={RiskTrends} />
        <Route path="/control-coverage" component={ControlCoverage} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/findings" component={Findings} />
        <Route path="/executive-summary" component={ExecutiveSummary} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <WorkspaceRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;

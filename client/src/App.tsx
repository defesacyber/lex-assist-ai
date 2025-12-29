import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseForm from "./pages/CaseForm";
import Analysis from "./pages/Analysis";
import Simulator from "./pages/Simulator";
import Deadlines from "./pages/Deadlines";
import Notifications from "./pages/Notifications";
import Assistant from "./pages/Assistant";
import Documents from "./pages/Documents";
import Subscription from "./pages/Subscription";
import CaseDetail from "./pages/CaseDetail";
import Integrations from "./pages/Integrations";
import Intelligence from "./pages/Intelligence";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Cases Routes */}
      <Route path="/cases" component={Cases} />
      <Route path="/cases/new" component={CaseForm} />
      <Route path="/cases/:id" component={CaseDetail} />
      <Route path="/cases/:id/edit" component={CaseForm} />
      
      {/* Analysis Routes */}
      <Route path="/analysis" component={Analysis} />
      
      {/* Simulator Routes */}
      <Route path="/simulator" component={Simulator} />
      
      {/* Deadlines Routes */}
      <Route path="/deadlines" component={Deadlines} />
      
      {/* Notifications Routes */}
      <Route path="/notifications" component={Notifications} />
      
      {/* Assistant and Documents Routes */}
      <Route path="/assistant" component={Assistant} />
      <Route path="/documents" component={Documents} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/intelligence" component={Intelligence} />
      <Route path="/settings" component={ComingSoon} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Placeholder component for features in development
function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold mb-2">Em Desenvolvimento</h1>
        <p className="text-muted-foreground mb-4">
          Esta funcionalidade estará disponível em breve.
        </p>
        <a href="/dashboard" className="text-primary hover:underline">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

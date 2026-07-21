import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Home from '@/pages/Home';
import SettingsCatalog from '@/pages/SettingsCatalog';
import SettingDetail from '@/pages/SettingDetail';
import DiamondSearch from '@/pages/DiamondSearch';
import DiamondDetail from '@/pages/DiamondDetail';
import ReviewRing from '@/pages/ReviewRing';
import CheckoutDemo from '@/pages/CheckoutDemo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/setting" component={SettingsCatalog} />
      <Route path="/setting/:handle" component={SettingDetail} />
      
      <Route path="/diamond" component={DiamondSearch} />
      <Route path="/diamond/:id" component={DiamondDetail} />
      
      <Route path="/review" component={ReviewRing} />
      <Route path="/checkout-demo" component={CheckoutDemo} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

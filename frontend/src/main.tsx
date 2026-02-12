import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const networks = {
  localnet: { url: getFullnodeUrl('localnet') },
  testnet: { url: getFullnodeUrl('testnet') },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="testnet">
          <WalletProvider>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </HashRouter>
  </React.StrictMode>,
);

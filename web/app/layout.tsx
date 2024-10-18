import './global.css';
import { UiLayout } from '@/components/ui/ui-layout';
import { ClusterProvider } from '@/components/cluster/cluster-data-access';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { ReactQueryProvider } from './react-query-provider';
import {Dropdown} from '@/components/Dropdown';

export const metadata = {
  title: 'Rugsafe',
  description: 'Rugsafe: A Multichain Protocol for Recovering from & Defending against Rug Pulls',
};

const links: { label: string; path: string; dropdown?: { label: string; path: string }[] }[] = [
  // { label: 'Account', path: '/account' },
  { 
    label: 'Trade', 
    path: '/trade',
    dropdown: [
      { label: 'Swap', path: '/dex' },
      { label: 'Perpetuals', path: '/perps' },
      { label: 'Liquidity', path: '/liquidity' }, // Example route
    ],
  },
  { label: 'Vaults', path: '/vaults' },
  {label: 'Detector', path: '/detector'},
 
  // { label: 'Clusters', path: '/clusters' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <UiLayout links={links}>{children}</UiLayout>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
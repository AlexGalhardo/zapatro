import type { ReactNode } from 'react';
import { meta, Shell, viewport } from '@/components/Shell';

export const metadata = meta('pt-BR');
export { viewport };

export default function Layout({ children }: { children: ReactNode }): ReactNode {
	return <Shell lang="pt-BR">{children}</Shell>;
}

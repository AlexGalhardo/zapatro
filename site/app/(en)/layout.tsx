import type { ReactNode } from 'react';
import { meta, Shell, viewport } from '@/components/Shell';

export const metadata = meta('en');
export { viewport };

export default function Layout({ children }: { children: ReactNode }): ReactNode {
	return <Shell lang="en">{children}</Shell>;
}

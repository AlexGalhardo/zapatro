import type { ReactNode } from 'react';
import { Privacy } from '@/components/Pages';
import { meta } from '@/components/Shell';

export const metadata = meta('pt-BR', 'privacy.title', 'privacy/');

export default function Page(): ReactNode {
	return <Privacy lang="pt-BR" />;
}

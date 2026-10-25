import type { ReactNode } from 'react';
import { Presskit } from '@/components/Pages';
import { meta } from '@/components/Shell';

export const metadata = meta('pt-BR', 'press.title', 'presskit/');

export default function Page(): ReactNode {
	return <Presskit lang="pt-BR" />;
}

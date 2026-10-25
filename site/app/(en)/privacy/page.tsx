import type { ReactNode } from 'react';
import { Privacy } from '@/components/Pages';
import { meta } from '@/components/Shell';

export const metadata = meta('en', 'privacy.title', 'privacy/');

export default function Page(): ReactNode {
	return <Privacy lang="en" />;
}

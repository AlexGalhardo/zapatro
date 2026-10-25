import type { ReactNode } from 'react';

/** A store/community link, or a muted "coming soon" badge while the page does not exist. */
export function StoreBadge({
	url,
	label,
	soon,
	plain = false,
}: {
	url: string | null;
	label: string;
	soon: string;
	plain?: boolean;
}): ReactNode {
	const look = plain ? 'inline-flex min-h-11 items-center gap-1 md:min-h-0' : 'btn text-base';
	if (url)
		return (
			<a href={url} className={`${look} ${plain ? 'text-text' : ''}`}>
				{label}
				<span aria-hidden="true">↗</span>
			</a>
		);
	// Plain text, not a disabled link: nothing to click until the page exists.
	return (
		<span
			className={`${look} cursor-default text-dim ${plain ? '' : 'bg-panel-dark shadow-none hover:text-dim'}`}
		>
			{label}
			<small className="text-dim text-xs">({soon})</small>
		</span>
	);
}

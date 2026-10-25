/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** "true" mutes every sound (set in .env). */
	readonly SOUND_MUTED?: string;
	/** "1" builds the web demo (championships 1–2, features.ts). */
	readonly VITE_DEMO?: string;
	/** "1" builds for Poki (Poki SDK, features.ts). */
	readonly VITE_POKI?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

/** package.json version injected by Vite (SemVer build shown in the footer). */
declare const __APP_VERSION__: string;
declare const __BUILD_NAME__: string;
/** True when public/assets/atlas/ (group atlases) exists at build time (final art available). */
declare const __HAS_ATLAS__: boolean;

/** Files present in public/assets at build/dev-server start (paths relative to public/). */
declare const __ASSET_FILES__: readonly string[];

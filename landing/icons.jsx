/* Minimal lucide-style icon set (stroke=1.75 to match lucide-react default look).
   In the real Next.js project these come from `lucide-react`.
*/
const Icon = ({
	children,
	size = 20,
	className = '',
	stroke = 1.75,
	fill = 'none',
}) => (
	<svg
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill={fill}
		stroke="currentColor"
		strokeWidth={stroke}
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		{children}
	</svg>
);

const IPlay = (p) => (
	<Icon {...p}>
		<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
	</Icon>
);
const IPlayCircle = (p) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="10" />
		<polygon points="10 8 16 12 10 16 10 8" />
	</Icon>
);
const IArrowRight = (p) => (
	<Icon {...p}>
		<path d="M5 12h14" />
		<path d="m12 5 7 7-7 7" />
	</Icon>
);
const IArrowUpRight = (p) => (
	<Icon {...p}>
		<path d="M7 17 17 7" />
		<path d="M7 7h10v10" />
	</Icon>
);
const ICheck = (p) => (
	<Icon {...p}>
		<polyline points="20 6 9 17 4 12" />
	</Icon>
);
const IChevronDown = (p) => (
	<Icon {...p}>
		<polyline points="6 9 12 15 18 9" />
	</Icon>
);
const ISparkles = (p) => (
	<Icon {...p}>
		<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
		<path d="M5 3v4" />
		<path d="M19 17v4" />
		<path d="M3 5h4" />
		<path d="M17 19h4" />
	</Icon>
);
const IShield = (p) => (
	<Icon {...p}>
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
	</Icon>
);
const IUsers = (p) => (
	<Icon {...p}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</Icon>
);
const IThumbsUp = (p) => (
	<Icon {...p}>
		<path d="M7 10v12" />
		<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
	</Icon>
);
const IWrench = (p) => (
	<Icon {...p}>
		<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
	</Icon>
);
const ITarget = (p) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="10" />
		<circle cx="12" cy="12" r="6" />
		<circle cx="12" cy="12" r="2" />
	</Icon>
);
const IBookOpen = (p) => (
	<Icon {...p}>
		<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
		<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
	</Icon>
);
const IPalette = (p) => (
	<Icon {...p}>
		<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
		<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
		<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
		<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
		<path d="M12 2a10 10 0 1 0 0 20 1.5 1.5 0 0 0 1.06-2.56 1.5 1.5 0 0 1 1.06-2.56h1.88a4 4 0 0 0 4-4 10 10 0 0 0-10-10z" />
	</Icon>
);
const IImage = (p) => (
	<Icon {...p}>
		<rect width="18" height="18" x="3" y="3" rx="2" />
		<circle cx="9" cy="9" r="2" />
		<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
	</Icon>
);
const ISliders = (p) => (
	<Icon {...p}>
		<line x1="4" x2="4" y1="21" y2="14" />
		<line x1="4" x2="4" y1="10" y2="3" />
		<line x1="12" x2="12" y1="21" y2="12" />
		<line x1="12" x2="12" y1="8" y2="3" />
		<line x1="20" x2="20" y1="21" y2="16" />
		<line x1="20" x2="20" y1="12" y2="3" />
		<line x1="2" x2="6" y1="14" y2="14" />
		<line x1="10" x2="14" y1="8" y2="8" />
		<line x1="18" x2="22" y1="16" y2="16" />
	</Icon>
);
const IMessageSquare = (p) => (
	<Icon {...p}>
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</Icon>
);
const IMessageCircle = (p) => (
	<Icon {...p}>
		<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
	</Icon>
);
const IShoppingCart = (p) => (
	<Icon {...p}>
		<circle cx="8" cy="21" r="1" />
		<circle cx="19" cy="21" r="1" />
		<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
	</Icon>
);
const IRadio = (p) => (
	<Icon {...p}>
		<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
		<path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
		<circle cx="12" cy="12" r="2" />
		<path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
		<path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
	</Icon>
);
const IUserPlus = (p) => (
	<Icon {...p}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<line x1="19" x2="19" y1="8" y2="14" />
		<line x1="22" x2="16" y1="11" y2="11" />
	</Icon>
);
const ILayers = (p) => (
	<Icon {...p}>
		<path d="m12.83 2.18 8.94 4.9a1 1 0 0 1 0 1.76L12 14 2.23 8.84a1 1 0 0 1 0-1.76l8.94-4.9a2 2 0 0 1 1.66 0Z" />
		<path d="m2 13 10 5.66L22 13" />
		<path d="m2 17 10 5.66L22 17" />
	</Icon>
);
const IHandshake = (p) => (
	<Icon {...p}>
		<path d="m11 17 2 2a1 1 0 1 0 3-3" />
		<path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
		<path d="m21 3 1 11h-2" />
		<path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
		<path d="M3 4h8" />
	</Icon>
);
const IStar = (p) => (
	<Icon {...p}>
		<polygon
			points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
			fill="currentColor"
			stroke="none"
		/>
	</Icon>
);
const ILightning = (p) => (
	<Icon {...p}>
		<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
	</Icon>
);
const IZap = ILightning;
const IClock = (p) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="10" />
		<polyline points="12 6 12 12 16 14" />
	</Icon>
);
const IBolt = ILightning;
const IPhone = (p) => (
	<Icon {...p}>
		<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
	</Icon>
);
const ICircleX = (p) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="10" />
		<path d="m15 9-6 6" />
		<path d="m9 9 6 6" />
	</Icon>
);
const IDownload = (p) => (
	<Icon {...p}>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" x2="12" y1="15" y2="3" />
	</Icon>
);
const IVolume2 = (p) => (
	<Icon {...p}>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
		<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
	</Icon>
);
const IMaximize = (p) => (
	<Icon {...p}>
		<path d="M8 3H5a2 2 0 0 0-2 2v3" />
		<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
		<path d="M3 16v3a2 2 0 0 0 2 2h3" />
		<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
	</Icon>
);
const ISettings = (p) => (
	<Icon {...p}>
		<circle cx="12" cy="12" r="3" />
		<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
	</Icon>
);

Object.assign(window, {
	Icon,
	IPlay,
	IPlayCircle,
	IArrowRight,
	IArrowUpRight,
	ICheck,
	IChevronDown,
	ISparkles,
	IShield,
	IUsers,
	IThumbsUp,
	IWrench,
	ITarget,
	IBookOpen,
	IPalette,
	IImage,
	ISliders,
	IMessageSquare,
	IMessageCircle,
	IShoppingCart,
	IRadio,
	IUserPlus,
	ILayers,
	IHandshake,
	IStar,
	ILightning,
	IZap,
	IClock,
	IBolt,
	IPhone,
	ICircleX,
	IDownload,
	IVolume2,
	IMaximize,
	ISettings,
});

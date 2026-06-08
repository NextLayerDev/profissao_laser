export type LaserLineTypeSoftware = 'Ezcad' | 'Lightburn' | 'LaserGRBL';

export const LASER_LINE_TYPE_SOFTWARES: LaserLineTypeSoftware[] = [
	'Ezcad',
	'Lightburn',
	'LaserGRBL',
];

export interface LaserLineType {
	id: string;
	software: LaserLineTypeSoftware;
	name: string;
	imageUrl: string | null;
	order: number;
	createdAt: string;
}

export interface CreateLaserLineTypePayload {
	software: LaserLineTypeSoftware;
	name: string;
	order?: number;
	file?: File;
}

export interface UpdateLaserLineTypePayload {
	software?: LaserLineTypeSoftware;
	name?: string;
	order?: number;
	file?: File;
}

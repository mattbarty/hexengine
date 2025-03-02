import { HexCoord } from '../types';

// Constants for hex calculations
const SQRT3 = Math.sqrt(3);

// Convert cube coordinates to 3D position
export function hexToPixel(hex: HexCoord, hexSize: number): [number, number] {
	const x = hexSize * ((3 / 2) * hex.q);
	const y = hexSize * ((SQRT3 / 2) * hex.q + SQRT3 * hex.r);
	return [x, y];
}

// Convert 3D position to cube coordinates
export function pixelToHex(x: number, y: number, hexSize: number): HexCoord {
	const q = ((2 / 3) * x) / hexSize;
	const r = ((-1 / 3) * x + (SQRT3 / 3) * y) / hexSize;

	return hexRound({ q, r, s: -q - r });
}

// Round floating-point hex coordinates to nearest hex
export function hexRound(hex: HexCoord): HexCoord {
	let q = Math.round(hex.q);
	let r = Math.round(hex.r);
	let s = Math.round(hex.s);

	const q_diff = Math.abs(q - hex.q);
	const r_diff = Math.abs(r - hex.r);
	const s_diff = Math.abs(s - hex.s);

	if (q_diff > r_diff && q_diff > s_diff) {
		q = -r - s;
	} else if (r_diff > s_diff) {
		r = -q - s;
	} else {
		s = -q - r;
	}

	return { q, r, s };
}

// Get all the hexes in a certain radius from center
export function getHexesInRadius(radius: number): HexCoord[] {
	const results: HexCoord[] = [];

	for (let q = -radius; q <= radius; q++) {
		const r1 = Math.max(-radius, -q - radius);
		const r2 = Math.min(radius, -q + radius);

		for (let r = r1; r <= r2; r++) {
			const s = -q - r;
			results.push({ q, r, s });
		}
	}

	return results;
}

// Get the distance between two hexes
export function hexDistance(a: HexCoord, b: HexCoord): number {
	return Math.max(
		Math.abs(a.q - b.q),
		Math.abs(a.r - b.r),
		Math.abs(a.s - b.s)
	);
}

// Get neighbors of a hex
export const directions: HexCoord[] = [
	{ q: 1, r: -1, s: 0 },
	{ q: 1, r: 0, s: -1 },
	{ q: 0, r: 1, s: -1 },
	{ q: -1, r: 1, s: 0 },
	{ q: -1, r: 0, s: 1 },
	{ q: 0, r: -1, s: 1 },
];

// Get a neighbor in a specific direction
export function hexNeighbor(hex: HexCoord, direction: number): HexCoord {
	const dir = directions[direction];
	return {
		q: hex.q + dir.q,
		r: hex.r + dir.r,
		s: hex.s + dir.s,
	};
}

// Get all neighbors of a hex
export function getAllNeighbors(hex: HexCoord): HexCoord[] {
	return directions.map((dir) => ({
		q: hex.q + dir.q,
		r: hex.r + dir.r,
		s: hex.s + dir.s,
	}));
}

// Create a unique id for a hex
export function getHexId(hex: HexCoord): string {
	return `${hex.q},${hex.r},${hex.s}`;
}

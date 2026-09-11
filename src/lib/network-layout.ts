import { AGENTS, type Agent } from "./mock";

/**
 * Position of a node in the network, as a percentage of the stage box.
 * Cards and the SVG overlay both read these same numbers, so a connector
 * can never drift away from the card it points at.
 */
export interface NodePosition {
  /** 0-100, left to right. */
  x: number;
  /** 0-100, top to bottom. */
  y: number;
  /** Which side of the card the connector should leave from. */
  anchor: "left" | "right";
}

export interface NetworkNode extends Agent {
  pos: NodePosition;
}

/** The orb sits dead centre; every connector terminates here. */
export const HUB: { x: number; y: number } = { x: 50, y: 50 };

/**
 * Mirrors the reference layout: a ring of cards around the central orb,
 * four down the left, four down the right, one at top centre.
 */
const POSITIONS: Record<string, NodePosition> = {
  website: { x: 42, y: 7, anchor: "right" },
  support: { x: 62, y: 14, anchor: "left" },
  whatsapp: { x: 32, y: 24, anchor: "right" },
  crm: { x: 71, y: 34, anchor: "left" },
  email: { x: 27, y: 45, anchor: "right" },
  content: { x: 73, y: 56, anchor: "left" },
  calendar: { x: 29, y: 66, anchor: "right" },
  analytics: { x: 69, y: 77, anchor: "left" },
  automation: { x: 35, y: 87, anchor: "right" },
};

export const NETWORK_NODES: NetworkNode[] = AGENTS.map((agent) => ({
  ...agent,
  pos: POSITIONS[agent.id],
}));

/**
 * Builds a cubic bezier from a node to the hub. Control points are pushed
 * horizontally toward the hub so the curve bows outward rather than running
 * straight through the orb, matching the reference's arcing traces.
 */
export function connectorPath(pos: NodePosition): string {
  const sx = pos.x;
  const sy = pos.y;
  const ex = HUB.x;
  const ey = HUB.y;

  // Leave the card horizontally, then sweep into the hub. The first control
  // point holds the card's own height so the trace exits flat; the second
  // approaches the hub along the vertical, giving each curve a visible bow
  // instead of a near-straight diagonal.
  const dir = pos.anchor === "right" ? 1 : -1;
  const dx = Math.abs(ex - sx);
  const dy = sy - ey;

  const c1x = sx + dir * dx * 0.55;
  const c1y = sy;
  const c2x = ex - dir * dx * 0.12;
  const c2y = ey + dy * 0.72;

  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
}

import { AGENTS, type Agent } from "./mock";

/**
 * The network lives in a fixed design coordinate space that is scaled as a
 * single unit to fit the available box. Cards, the orb and the SVG connector
 * layer all read these same numbers, so nothing can drift out of alignment at
 * any viewport size — which is exactly what percentage positioning did.
 */
// Step 3: the orb grows ~35% and the arcs widen with it, so the stage is
// wider (1200, was 1000) as well as taller — a bigger globe in the same
// width would leave no room for the cards to clear it.
export const STAGE_W = 1200;
/**
 * Tall enough that the top-centre card clears the orb with MIN_GAP to spare:
 * the orb's radius plus the card's height plus that gap, top and bottom.
 */
export const STAGE_H = 690;

/**
 * Compact stage: same width, much shorter, for viewports that cannot give
 * the centre column enough height. Cards are icon + name only here, so they
 * need far less vertical room and the arcs pull in tight.
 */
export const COMPACT_H = 510;

/** Card footprint in stage units. Used for gap checks and edge anchoring. */
/** Wide enough for the longest tagline at the larger Step 3 font size. */
export const CARD_W = 252;
export const CARD_H = 72;

/** The orb sits dead centre; every connector terminates at its edge. */
export const HUB = { x: STAGE_W / 2, y: STAGE_H / 2 };

/** Radius of the orb's visible disc in stage units. +35% per Step 3 (was 168). */
export const ORB_R = 227;

export interface NodePosition {
  /** Card centre, in stage units. */
  x: number;
  y: number;
  /** Which side of the card the connector leaves from. */
  anchor: "left" | "right";
}

export interface NetworkNode extends Agent {
  pos: NodePosition;
}

/**
 * Symmetric arcs: four cards down each side, mirrored about the centre line,
 * with the middle two pushed further out so the arc bows around the orb. The
 * website agent — the flagship — takes the top-centre slot.
 *
 * Live agents hold the top positions on each side.
 */
// Widened along with the stage so the arcs clear the bigger orb: near cards
// sit further from the centre line than the old 152/122 pair did.
const LEFT_X = { near: 172, far: 132 };
const RIGHT_X = { near: STAGE_W - 172, far: STAGE_W - 132 };

/**
 * Minimum clear space between any card edge and the orb's disc, and between
 * neighbouring cards. Cards also float +/-3px, so this must exceed that.
 */
export const MIN_GAP = 18;

/**
 * How much larger the PAINTED globe is than `orbR`.
 *
 * `orbR` is the disc the connectors terminate on. The canvas is deliberately
 * drawn larger than that box (`-inset-[22%]` in voice-orb.tsx, so 1.44x) and
 * the globe fills ~0.863 of that canvas's half-width — measured from rendered
 * pixels, not assumed. Net: the globe paints ~1.24x `orbR`.
 *
 * Laying cards out against `orbR` alone is why the top-centre card overlapped
 * the globe at every width: the maths said 18u of clearance while the visible
 * sphere reached ~45u past where the maths thought its edge was.
 */
export const GLOBE_PAINT_SCALE = 1.24 * 0.863;

/** The radius the globe actually occupies on screen, in stage units. */
export function paintedOrbR(orbR: number): number {
  return orbR * GLOBE_PAINT_SCALE;
}

/**
 * The top-centre card is the one that can collide with the orb head-on, so its
 * position is derived from the orb rather than hardcoded: sit its bottom edge
 * MIN_GAP above the disc, and never let it leave the stage.
 */
function topCentreY(hubY: number, orbR: number, cardH: number): number {
  return Math.max(
    cardH / 2,
    hubY - paintedOrbR(orbR) - MIN_GAP - cardH / 2,
  );
}

const POSITIONS: Record<string, NodePosition> = {
  // Top centre — derived so it always clears the globe.
  website: { x: HUB.x, y: topCentreY(HUB.y, ORB_R, CARD_H), anchor: "right" },

  // Left arc, top to bottom. Evenly spaced with >= MIN_GAP between cards.
  whatsapp: { x: LEFT_X.near, y: 198, anchor: "right" },
  email: { x: LEFT_X.far, y: 344, anchor: "right" },
  calendar: { x: LEFT_X.far, y: 489, anchor: "right" },
  automation: { x: LEFT_X.near, y: 635, anchor: "right" },

  // Right arc, top to bottom.
  support: { x: RIGHT_X.near, y: 198, anchor: "left" },
  crm: { x: RIGHT_X.far, y: 344, anchor: "left" },
  content: { x: RIGHT_X.far, y: 489, anchor: "left" },
  analytics: { x: RIGHT_X.near, y: 635, anchor: "left" },
};

/** Compact cards are icon + name only, so they are much smaller. */
export const COMPACT_CARD_W = 168;
export const COMPACT_CARD_H = 46;
/** +35% per Step 3, same as the full-size orb (was 126). */
export const COMPACT_ORB_R = 170;

/** Compact arcs: the same symmetry, squeezed into COMPACT_H. */
const COMPACT_HUB_Y = COMPACT_H / 2;
const COMPACT_POSITIONS: Record<string, NodePosition> = {
  website: {
    x: STAGE_W / 2,
    y: topCentreY(COMPACT_HUB_Y, COMPACT_ORB_R, COMPACT_CARD_H),
    anchor: "right",
  },

  whatsapp: { x: 124, y: 155, anchor: "right" },
  email: { x: 94, y: 264, anchor: "right" },
  calendar: { x: 94, y: 373, anchor: "right" },
  automation: { x: 124, y: 481, anchor: "right" },

  support: { x: STAGE_W - 124, y: 155, anchor: "left" },
  crm: { x: STAGE_W - 94, y: 264, anchor: "left" },
  content: { x: STAGE_W - 94, y: 373, anchor: "left" },
  analytics: { x: STAGE_W - 124, y: 481, anchor: "left" },
};

export const NETWORK_NODES: NetworkNode[] = AGENTS.map((agent) => ({
  ...agent,
  pos: POSITIONS[agent.id],
}));

export const COMPACT_NODES: NetworkNode[] = AGENTS.map((agent) => ({
  ...agent,
  pos: COMPACT_POSITIONS[agent.id],
}));

/**
 * Geometry for one of the two stage variants. Passing this around keeps the
 * card, connector and orb maths reading from a single source per variant.
 */
export interface StageGeometry {
  height: number;
  cardW: number;
  cardH: number;
  orbR: number;
  hub: { x: number; y: number };
  nodes: NetworkNode[];
}

export const FULL_STAGE: StageGeometry = {
  height: STAGE_H,
  cardW: CARD_W,
  cardH: CARD_H,
  orbR: ORB_R,
  hub: HUB,
  nodes: NETWORK_NODES,
};

export const COMPACT_STAGE: StageGeometry = {
  height: COMPACT_H,
  cardW: COMPACT_CARD_W,
  cardH: COMPACT_CARD_H,
  orbR: COMPACT_ORB_R,
  hub: { x: STAGE_W / 2, y: COMPACT_HUB_Y },
  nodes: COMPACT_NODES,
};

/**
 * Warns in development when a card's box intrudes on the orb's disc. The
 * top-centre card is the one that collides head-on, and a silent overlap there
 * is exactly the bug this module exists to prevent.
 */
function assertClearance(g: StageGeometry, label: string) {
  for (const node of g.nodes) {
    const dx = Math.max(
      0,
      Math.abs(node.pos.x - g.hub.x) - g.cardW / 2,
    );
    const dy = Math.max(
      0,
      Math.abs(node.pos.y - g.hub.y) - g.cardH / 2,
    );
    // Against the PAINTED radius, not orbR: measuring against orbR is what
    // let the top-centre card sit on top of the visible globe.
    const gap = Math.hypot(dx, dy) - paintedOrbR(g.orbR);
    if (gap < MIN_GAP) {
      console.warn(
        `[network-layout] ${label}: "${node.id}" clears the orb by ` +
          `${gap.toFixed(1)}u, below MIN_GAP (${MIN_GAP}u).`,
      );
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  assertClearance(FULL_STAGE, "full");
  assertClearance(COMPACT_STAGE, "compact");
}

/** The point on a card's inner edge where its connector attaches. */
export function cardAnchor(
  pos: NodePosition,
  g: StageGeometry = FULL_STAGE,
): { x: number; y: number } {
  const half = g.cardW / 2;
  return {
    x: pos.anchor === "right" ? pos.x + half : pos.x - half,
    y: pos.y,
  };
}

/**
 * Builds a curved connector from a card's inner edge to the facing point on
 * the orb's edge — not to its centre, so no line ever disappears under the
 * globe. Control points are pushed horizontally so the curve bows rather than
 * running as a flat diagonal.
 */
export function connectorPath(
  pos: NodePosition,
  g: StageGeometry = FULL_STAGE,
): string {
  const start = cardAnchor(pos, g);
  const end = connectorEnd(pos, g);

  // Leave the card horizontally, arrive at the orb along the same heading.
  const dir = pos.anchor === "right" ? 1 : -1;
  const span = Math.abs(end.x - start.x);
  const c1 = { x: start.x + dir * Math.max(span * 0.45, 40), y: start.y };
  const c2 = { x: end.x - dir * Math.max(span * 0.2, 24), y: end.y };

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

/** Endpoint of a connector on the orb's rim, facing the card. */
export function connectorEnd(
  pos: NodePosition,
  g: StageGeometry = FULL_STAGE,
): { x: number; y: number } {
  const start = cardAnchor(pos, g);
  const dx = g.hub.x - start.x;
  const dy = g.hub.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x: g.hub.x - (dx / dist) * g.orbR,
    y: g.hub.y - (dy / dist) * g.orbR,
  };
}

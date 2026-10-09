// Picks an emoji for a category tile from words in its name; falls back to the first letter.
const ICONS = [
  [/switch|socket|plug|board/i, '🔌'],
  [/wire|cable/i, '🧵'],
  [/light|led|bulb|lamp|tube/i, '💡'],
  [/fan/i, '🌀'],
  [/mcb|breaker|fuse|db\b|distribution/i, '⚡'],
  [/pipe|pvc|cpvc|nal/i, '🚰'],
  [/tap|faucet|shower|bath/i, '🚿'],
  [/tank|valve/i, '🛢️'],
  [/fitting|elbow|tee|joint|tool/i, '🔧'],
  [/motor|pump/i, '⚙️'],
];

export function categoryIcon(name) {
  return ICONS.find(([re]) => re.test(name))?.[1] || null;
}

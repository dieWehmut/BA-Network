export type Node = { id: number }
export type Link = { source: number; target: number }

type Snapshot = { nodes: Node[]; links: Link[] }

// Generate BA model snapshots. Returns an array of snapshots after each step.
export function generateBASnapshots(
  initialNodes: number,
  attachPerStep: number,
  steps: number,
): Snapshot[] {
  const snapshots: Snapshot[] = []

  if (initialNodes < 1) initialNodes = 1
  if (attachPerStep < 1) attachPerStep = 1

  // start with a small clique of initialNodes
  const nodes: Node[] = []
  const links: Link[] = []

  for (let i = 0; i < initialNodes; i++) nodes.push({ id: i })

  for (let i = 0; i < initialNodes; i++) {
    for (let j = i + 1; j < initialNodes; j++) {
      links.push({ source: i, target: j })
    }
  }

  // helper: compute degree list (array of node ids repeated by degree)
  function degreeBag(): number[] {
    const deg: Record<number, number> = {}
    nodes.forEach((n) => (deg[n.id] = 0))
    links.forEach((l) => {
      deg[l.source] = (deg[l.source] || 0) + 1
      deg[l.target] = (deg[l.target] || 0) + 1
    })
    const bag: number[] = []
    Object.keys(deg).forEach((k) => {
      const id = Number(k)
      for (let t = 0; t < deg[id]; t++) bag.push(id)
    })
    // fallback: if bag empty (very small graphs), allow uniform selection
    if (bag.length === 0) return nodes.map((n) => n.id)
    return bag
  }

  let nextId = initialNodes

  for (let step = 0; step < steps; step++) {
    // add one new node
    const newNode: Node = { id: nextId++ }
    nodes.push(newNode)

    // attach to attachPerStep existing nodes (no multi-edge to same node)
    const bag = degreeBag()
    const targets = new Set<number>()

    // if bag smaller than attachPerStep, sample with replacement but avoid duplicates
    while (targets.size < attachPerStep && targets.size < nodes.length - 1) {
      const pick = bag[Math.floor(Math.random() * bag.length)]
      if (pick !== newNode.id) targets.add(pick)
      // if bag empty or only contains new node (unlikely), fallback to random
      if (bag.length === 0) {
        const r = Math.floor(Math.random() * (nodes.length - 1))
        if (r !== newNode.id) targets.add(r)
      }
    }

    for (const t of Array.from(targets)) {
      links.push({ source: newNode.id, target: t })
    }

    // record snapshot (make shallow copies)
    snapshots.push({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) })
  }

  return snapshots
}

export default generateBASnapshots

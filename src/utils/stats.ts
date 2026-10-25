import type { Node as BANode, Link as BALink } from './ba'

export type DegreeBucket = { degree: number; count: number }

export type NetworkStats = {
  /** Number of nodes in the current snapshot. */
  nodes: number
  /** Number of links in the current snapshot. */
  links: number
  /** Mean degree (2L / N). */
  avgDegree: number
  /** Largest degree in the snapshot. */
  maxDegree: number
  /** Graph density for an undirected simple graph. */
  density: number
  /** Number of connected components. */
  components: number
  /** Most frequent degree. */
  modeDegree: number
  /** Median degree. */
  medianDegree: number
  /** Share of nodes whose degree is at least 5, in percent. */
  pctGE5: number
  /** Degree histogram, sorted by degree. */
  degreeCounts: DegreeBucket[]
  /** Three best connected nodes. */
  topNodes: { id: number; degree: number }[]
}

const EMPTY: NetworkStats = {
  nodes: 0,
  links: 0,
  avgDegree: 0,
  maxDegree: 0,
  density: 0,
  components: 0,
  modeDegree: 0,
  medianDegree: 0,
  pctGE5: 0,
  degreeCounts: [],
  topNodes: [],
}

/** Derive every headline number the console dashboard shows from one snapshot. */
export function computeNetworkStats(nodes: BANode[], links: BALink[]): NetworkStats {
  if (!nodes || nodes.length === 0) return EMPTY

  const degreeMap: Record<number, number> = {}
  nodes.forEach((node) => {
    degreeMap[node.id] = 0
  })
  links.forEach((link) => {
    degreeMap[link.source] = (degreeMap[link.source] || 0) + 1
    degreeMap[link.target] = (degreeMap[link.target] || 0) + 1
  })

  const degrees = Object.values(degreeMap)
  const totalNodes = nodes.length
  const totalLinks = links.length

  const counts: Record<number, number> = {}
  degrees.forEach((degree) => {
    counts[degree] = (counts[degree] || 0) + 1
  })
  const degreeCounts: DegreeBucket[] = Object.entries(counts)
    .map(([degree, count]) => ({ degree: Number(degree), count }))
    .sort((a, b) => a.degree - b.degree)

  const modeDegree = degreeCounts.reduce(
    (acc, cur) => (cur.count > acc.count ? cur : acc),
    { degree: 0, count: 0 },
  ).degree

  let medianDegree = 0
  if (degreeCounts.length) {
    const total = degreeCounts.reduce((sum, bucket) => sum + bucket.count, 0)
    let cumulative = 0
    for (const bucket of degreeCounts) {
      cumulative += bucket.count
      if (cumulative >= total / 2) {
        medianDegree = bucket.degree
        break
      }
    }
  }

  const pctGE5 = Math.round(
    (degreeCounts
      .filter((bucket) => bucket.degree >= 5)
      .reduce((sum, bucket) => sum + bucket.count, 0) /
      Math.max(1, totalNodes)) *
      100,
  )

  const topNodes = Object.entries(degreeMap)
    .map(([id, degree]) => ({ id: Number(id), degree }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 3)

  // Connected components via a simple BFS over the adjacency list.
  const adjacency: Record<number, number[]> = {}
  nodes.forEach((node) => {
    adjacency[node.id] = []
  })
  links.forEach((link) => {
    adjacency[link.source] = adjacency[link.source] || []
    adjacency[link.target] = adjacency[link.target] || []
    adjacency[link.source].push(link.target)
    adjacency[link.target].push(link.source)
  })
  const visited = new Set<number>()
  let components = 0
  for (const node of nodes) {
    if (visited.has(node.id)) continue
    components += 1
    const queue = [node.id]
    visited.add(node.id)
    while (queue.length) {
      const current = queue.shift() as number
      for (const neighbour of adjacency[current] || []) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour)
          queue.push(neighbour)
        }
      }
    }
  }

  return {
    nodes: totalNodes,
    links: totalLinks,
    avgDegree: Number(((totalLinks * 2) / totalNodes).toFixed(2)),
    maxDegree: degrees.length ? Math.max(...degrees) : 0,
    density: totalNodes > 1 ? (2 * totalLinks) / (totalNodes * (totalNodes - 1)) : 0,
    components,
    modeDegree,
    medianDegree,
    pctGE5,
    degreeCounts,
    topNodes,
  }
}

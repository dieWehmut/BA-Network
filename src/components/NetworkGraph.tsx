import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import generateBASnapshots from '../utils/ba'
import type { Node as BANode, Link as BALink } from '../utils/ba'
import '../styles/NetworkGraph.css'

type Props = {
  initialNodes: number
  attachPerStep: number
  steps: number
  generationId: number
  onNodesUpdate?: (nodes: BANode[], links: BALink[]) => void
  width?: number
  height?: number
  stopSignal?: number
  pauseSignal?: number
  resumeSignal?: number
  tickDelay?: number
}

export default function NetworkGraph({
  initialNodes,
  attachPerStep,
  steps,
  generationId,
  onNodesUpdate,
  width = 720,
  height = 480,
  stopSignal,
  pauseSignal,
  resumeSignal,
  tickDelay,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [nodes, setNodes] = useState<BANode[]>([])
  const [links, setLinks] = useState<BALink[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<any | null>(null)
  const stepIndexRef = useRef<number>(0)
  const snapshotsRef = useRef<any[] | null>(null)

  const startTimer = (delay: number) => {
    if (timerRef.current) {
      try { timerRef.current.stop() } catch (err) { void err }
      timerRef.current = null
    }
    const t = d3.interval(() => {
      const snaps = snapshotsRef.current || []
      const idx = stepIndexRef.current
      if (idx >= snaps.length) {
        t.stop()
        timerRef.current = null
        setIsAnimating(false)
        return
      }
      const snap = snaps[idx]
      setNodes(snap.nodes)
      setLinks(snap.links)
      if (onNodesUpdate) onNodesUpdate(snap.nodes, snap.links)
      stepIndexRef.current = idx + 1
    }, delay)
    timerRef.current = t
  }
  useEffect(() => {
    // Only start generation when `generationId` changes (i.e. user clicked Generate).
    // Do NOT auto-regenerate when parameter props change.
    const snapshots = generateBASnapshots(initialNodes, attachPerStep, steps)
    snapshotsRef.current = snapshots

    // initial nodes/links for this run
    const initialNodesArr = snapshots.length ? snapshots[0].nodes.slice(0, initialNodes) : Array.from({ length: initialNodes }).map((_, i) => ({ id: i }))
    const initialLinksArr: any[] = []
    setNodes(initialNodesArr)
    setLinks(initialLinksArr)
    if (onNodesUpdate) onNodesUpdate(initialNodesArr, initialLinksArr)

    stepIndexRef.current = 0
    setIsAnimating(true)

    const delay = typeof tickDelay === 'number' ? tickDelay : 600
    startTimer(delay)

    return () => {
      try { if (timerRef.current) timerRef.current.stop() } catch (err) { void err }
      timerRef.current = null
      setIsAnimating(false)
    }
    // only regenerate when generationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId])
  // external stop signal: stop the ongoing generation immediately
  useEffect(() => {
    if (typeof stopSignal === 'number') {
      if (timerRef.current) {
        try { timerRef.current.stop() } catch (err) { void err }
        timerRef.current = null
      }
      setIsAnimating(false)
    }
  }, [stopSignal])

  useEffect(() => {
    if (typeof pauseSignal === 'number') {
      if (timerRef.current) {
        try { timerRef.current.stop() } catch (err) { void err }
        timerRef.current = null
      }
      // stop adding new nodes but keep the simulation running so the layout continues to move
      setIsAnimating(true)
    }
  }, [pauseSignal])

  useEffect(() => {
    if (typeof resumeSignal === 'number') {
      const snaps = snapshotsRef.current || []
      if (stepIndexRef.current < snaps.length && timerRef.current == null) {
        const delay = typeof tickDelay === 'number' ? tickDelay : 600
        startTimer(delay)
        setIsAnimating(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSignal, tickDelay])

  // allow changing speed (tickDelay) during an active generation: restart timer with new delay
  useEffect(() => {
    const snaps = snapshotsRef.current || []
    const delay = typeof tickDelay === 'number' ? tickDelay : 600
    // if a timer is active, restart it with the new delay
    if (timerRef.current) {
      try {
        timerRef.current.stop()
      } catch (err) {
        void err
      }
      timerRef.current = null
      // only restart if we still have remaining snapshots
      if (stepIndexRef.current < snaps.length) {
        startTimer(delay)
      }
    } else if (isAnimating && stepIndexRef.current < snaps.length) {
      // if we're in animating state but timer isn't present (edge case), start it
      startTimer(delay)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickDelay])

  // D3 force layout
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    // preserve current zoom transform so user zoom/translate isn't lost when we re-render
    let prevTransform: any = null
    try {
      prevTransform = d3.zoomTransform(svg.node() as any)
    } catch (err) {
      prevTransform = null
      void err
    }

    // reuse existing container if present to preserve zoom/handlers; otherwise create one
    let container = svg.select('g.container')
    if (container.empty()) {
      container = svg.append('g').attr('class', 'container')
      container.append('g').attr('class', 'links')
      container.append('g').attr('class', 'nodes')
    } else {
      // clear only links and nodes children (preserve zoom binding on svg)
      container.select('.links').selectAll('*').remove()
      container.select('.nodes').selectAll('*').remove()
    }

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(40))
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
    // make layout settle faster
    simulation.alphaDecay(0.06)

    const link = container
      .select('.links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)

    const degreeMap: Record<number, number> = {}
    links.forEach((l) => {
      degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
      degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
    })

    const node = container
      .select('.nodes')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => 4 + (degreeMap[(d as any).id] || 0))
      .attr('fill', (d: any) => ((degreeMap[(d as any).id] && degreeMap[(d as any).id] > 4) ? '#d62728' : '#1f77b4'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.6)
      .attr('class', 'node-circle')
      .call(
        d3
          .drag()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            ;(d as any).fx = (d as any).x
            ;(d as any).fy = (d as any).y
          })
          .on('drag', (event: any, d: any) => {
            ;(d as any).fx = event.x
            ;(d as any).fy = event.y
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            ;(d as any).fx = null
            ;(d as any).fy = null
          }),
      )

  // add interactive tooltip and hover behavior
  node
    .on('mouseover', function (this: SVGCircleElement, event: any, d: any) {
      try {
        const nid = (d as any).id
        const deg = degreeMap[nid] || 0
        // highlight node
        d3.select(this).transition().duration(120).attr('r', (4 + deg) * 1.6)
        // dim others
  container.selectAll('.nodes circle').filter(function (this: any) { return this !== event.target }).transition().duration(120).style('opacity', 0.25)
        // highlight connected links
        container.selectAll('.links line').transition().duration(120).style('stroke-opacity', (l: any) => (l.source === nid || l.target === nid ? 1 : 0.08)).style('stroke', (l: any) => (l.source === nid || l.target === nid ? '#ff8c00' : '#999'))
        // show tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block'
          tooltipRef.current.innerText = `ID: ${nid}  Degree: ${deg}`
          const parentRect = svgRef.current?.getBoundingClientRect()
          if (parentRect) {
            tooltipRef.current.style.left = `${event.clientX - parentRect.left + 12}px`
            tooltipRef.current.style.top = `${event.clientY - parentRect.top + 12}px`
          }
        }
      } catch (err) { void err }
    })
    .on('mousemove', function (this: SVGCircleElement, event: any) {
      if (tooltipRef.current && svgRef.current) {
        const parentRect = svgRef.current.getBoundingClientRect()
        tooltipRef.current.style.left = `${event.clientX - parentRect.left + 12}px`
        tooltipRef.current.style.top = `${event.clientY - parentRect.top + 12}px`
      }
    })
    .on('mouseout', function (this: SVGCircleElement, _event: any, d: any) {
      try {
        const nid = (d as any).id
        const deg = degreeMap[nid] || 0
  d3.select(this).transition().duration(120).attr('r', 4 + deg)
        container.selectAll('.nodes circle').transition().duration(120).style('opacity', 1)
        container.selectAll('.links line').transition().duration(120).style('stroke-opacity', 0.6).style('stroke', '#999')
        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      } catch (err) { void err }
    })

  node.append('title').text((d: any) => `ID: ${(d as any).id}\ndeg: ${degreeMap[(d as any).id] || 0}`)

    simulation.nodes(nodes as any).on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as any).x)
        .attr('y1', (d: any) => (d.source as any).y)
        .attr('x2', (d: any) => (d.target as any).x)
        .attr('y2', (d: any) => (d.target as any).y)

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)
    })

    ;(simulation.force('link') as any).links(links)

    // control simulation running: if we're not animating new nodes, stop shortly after layout stabilizes
    if (isAnimating) {
      // give the layout energy while animating
      simulation.alpha(0.3).restart()
    } else {
      // allow a short settle then stop simulation so nodes freeze and stop moving
      simulation.alpha(0.001)
      // stop after a brief timeout to let last tick apply
      const stopTimer = setTimeout(() => {
        try {
          simulation.stop()
        } catch (err) {
          void err
        }
      }, 300)
      // ensure cleanup of this timer on effect cleanup
      ;(simulation as any).__stopTimer = stopTimer
    }

    // zoom: set up once if not present, and restore previous transform
    const hasZoom = !!(svg as any).__hasZoom
    const zoom = d3.zoom().on('zoom', (event: any) => {
      container.attr('transform', event.transform.toString())
    })
    if (!hasZoom) {
      svg.call(zoom as any)
      ;(svg as any).__hasZoom = true
    }
    if (prevTransform) {
      try {
        // apply transform directly to container for immediate effect
        container.attr('transform', prevTransform.toString())
        // also inform zoom behavior about the transform
        try { svg.call((zoom as any).transform, prevTransform) } catch { void 0 }
      } catch (err) {
        void err
      }
    }

    return () => {
      try {
        // clear any stop timer
        const st = (simulation as any).__stopTimer
        if (st) clearTimeout(st)
      } catch (err) {
        void err
      }
      simulation.stop()
    }
  }, [nodes, links, isAnimating, width, height])

  return (
    <div className="network-graph" style={{ width, height, border: '1px solid #ddd' }}>
      {(() => {
        const totalSteps = snapshotsRef.current ? snapshotsRef.current.length : 0
        const currentStep = Math.min(stepIndexRef.current, totalSteps)
        let status = 'idle'
        if (currentStep >= totalSteps && totalSteps > 0) status = 'completed'
        else if (timerRef.current) status = 'generating'
        else if (isAnimating) status = 'paused'
        else status = 'stopped'

        // compute degrees from links for overlay stats
        const degreeMap: Record<number, number> = {}
        links.forEach((l) => {
          degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
          degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
        })
        const degrees = Object.values(degreeMap)
        const totalNodes = nodes.length
        const totalLinks = links.length
        const avgDegree = totalNodes ? Number(((totalLinks * 2) / totalNodes).toFixed(2)) : 0
        const maxDegree = degrees.length ? Math.max(...degrees) : 0
        const topNodes = Object.entries(degreeMap)
          .map(([id, deg]) => ({ id: Number(id), deg }))
          .sort((a, b) => b.deg - a.deg)
          .slice(0, 3)

        // compute density and connected components
        const density = totalNodes > 1 ? (2 * totalLinks) / (totalNodes * (totalNodes - 1)) : 0
        // build adjacency
        const adj: Record<number, number[]> = {}
        nodes.forEach((n) => (adj[n.id] = []))
        links.forEach((l) => {
          adj[l.source] = adj[l.source] || []
          adj[l.target] = adj[l.target] || []
          adj[l.source].push(l.target)
          adj[l.target].push(l.source)
        })
        const visited = new Set<number>()
        let componentsCount = 0
        for (const n of nodes) {
          if (visited.has(n.id)) continue
          componentsCount++
          // BFS
          const q = [n.id]
          visited.add(n.id)
          while (q.length) {
            const cur = q.shift() as number
            for (const nb of adj[cur] || []) {
              if (!visited.has(nb)) {
                visited.add(nb)
                q.push(nb)
              }
            }
          }
        }

        // prepare overlay lines and measure width to size the rect
        const lines: { text: string; fontSize: number; weight?: number }[] = [
          { text: `Nodes: ${totalNodes}  Links: ${totalLinks}`, fontSize: 12 },
          { text: `Step: ${currentStep} / ${totalSteps}  Attach: ${attachPerStep}`, fontSize: 12 },
          { text: `Avg deg: ${avgDegree}  Max deg: ${maxDegree}`, fontSize: 12 },
          { text: `Top: ${topNodes.map((t) => `${t.id}(${t.deg})`).join(', ') || '—'}`, fontSize: 12 },
          { text: `Density: ${density.toFixed(4)}  Components: ${componentsCount}`, fontSize: 12 },
          { text: `Status: ${status}`, fontSize: 12 },
        ]

        let rectWidth = 220
        let rectHeight = 20 + lines.length * 16
        try {
          if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (ctx) {
              let maxW = 0
              for (const ln of lines) {
                const weight = ln.weight && ln.weight >= 700 ? '700' : '400'
                ctx.font = `${weight} ${ln.fontSize}px Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial`
                const w = ctx.measureText(ln.text).width
                if (w > maxW) maxW = w
              }
              rectWidth = Math.max(140, Math.ceil(maxW) + 28)
              rectHeight = Math.max(48, 12 + lines.length * 18)
            }
          }
        } catch (err) {
          void err
        }

        return (
          <svg ref={svgRef} width={width} height={height}>
            {/* overlay UI that should not be zoomed/panned */}
            <g className="network-overlay" transform={`translate(0,0)`}> 
                <rect x={0} y={0} rx={8} ry={8} width={rectWidth} height={rectHeight} fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.06)" />
                {lines.map((ln, i) => (
                  <text key={i} x={8} y={14 + i * 18} fontSize={ln.fontSize} fill="#fff" style={{ fontWeight: ln.weight || 400 }}>
                    {ln.text}
                  </text>
                ))}
              </g>
          </svg>
        )
      })()}
    </div>
  )
}


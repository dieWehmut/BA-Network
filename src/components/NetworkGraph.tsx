import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import generateBASnapshots from '../utils/ba'
import { endpointId } from '../utils/stats'
import type { Node as BANode, Link as BALink } from '../utils/ba'
import '../styles/NetworkGraph.css'

/** Node radius for a given degree; sqrt so hubs stay proportionate. */
function nodeRadius(degree: number) {
  return 3.2 + Math.sqrt(Math.max(0, degree)) * 1.5
}

type Props = {
  initialNodes: number
  attachPerStep: number
  steps: number
  generationId: number
  onNodesUpdate?: (nodes: BANode[], links: BALink[]) => void
  /** Reports generation progress to the console dashboard. */
  onProgress?: (currentStep: number, totalSteps: number, status: string) => void
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
  onProgress,
  width = 720,
  height = 480,
  stopSignal,
  pauseSignal,
  resumeSignal,
  tickDelay,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // The graph box is fluid, so track its real pixel size and draw at that size.
  // Falling back to the props keeps the first paint (and SSR) sane.
  const [{ w: boxW, h: boxH }, setBox] = useState({ w: width, h: height })
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setBox({ w: Math.max(240, Math.round(rect.width)), h: Math.max(200, Math.round(rect.height)) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
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
        if (onProgress) onProgress(snaps.length, snaps.length, 'completed')
        return
      }
      const snap = snaps[idx]
      setNodes(snap.nodes)
      setLinks(snap.links)
      if (onNodesUpdate) onNodesUpdate(snap.nodes, snap.links)
      stepIndexRef.current = idx + 1
      if (onProgress) onProgress(idx + 1, snaps.length, 'generating')
    }, delay)
    timerRef.current = t
  }
  useEffect(() => {
    // Only start generation when `generationId` changes (i.e. user clicked Generate).
    // Do NOT auto-regenerate when parameter props change.
    const snapshots = generateBASnapshots(initialNodes, attachPerStep, steps)
    snapshotsRef.current = snapshots
    if (onProgress) onProgress(0, snapshots.length, 'generating')

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
      const snaps = snapshotsRef.current || []
      if (onProgress) onProgress(stepIndexRef.current, snaps.length, 'paused')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseSignal])

  useEffect(() => {
    if (typeof resumeSignal === 'number') {
      const snaps = snapshotsRef.current || []
      if (stepIndexRef.current < snaps.length && timerRef.current == null) {
        const delay = typeof tickDelay === 'number' ? tickDelay : 600
        startTimer(delay)
        setIsAnimating(true)
        if (onProgress) onProgress(stepIndexRef.current, snaps.length, 'generating')
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

    // Scale the layout to the canvas so the network fills the stage instead of
    // clustering in the middle of it.
    const areaPerNode = (boxW * boxH) / Math.max(1, nodes.length)
    const linkDistance = Math.max(34, Math.min(96, Math.sqrt(areaPerNode) * 0.85))

    // Every snapshot arrives with fresh node objects, so seed the layout on an
    // elliptical golden-angle spiral: the simulation then only relaxes locally
    // instead of collapsing everything into the centre before it freezes.
    const radiusX = boxW * 0.44
    const radiusY = boxH * 0.44
    const golden = Math.PI * (3 - Math.sqrt(5))
    const degreeMapSeed: Record<number, number> = {}
    links.forEach((link) => {
      const source = endpointId(link.source as never)
      const target = endpointId(link.target as never)
      degreeMapSeed[source] = (degreeMapSeed[source] || 0) + 1
      degreeMapSeed[target] = (degreeMapSeed[target] || 0) + 1
    })
    ;(nodes as any[]).forEach((node, index) => {
      const ratio = Math.sqrt((index + 0.5) / Math.max(1, nodes.length))
      const angle = index * golden
      node.x = boxW / 2 + Math.cos(angle) * radiusX * ratio
      node.y = boxH / 2 + Math.sin(angle) * radiusY * ratio
    })

    // forceCenter alone collapses everything into a tight blob, so pull towards
    // the middle only weakly and let repulsion spread the network to the frame.
    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(-linkDistance * 5).distanceMax(linkDistance * 8))
      .force('collide', d3.forceCollide((d: any) => nodeRadius(degreeMapSeed[(d as any).id] || 0) + 3))
      .force('x', d3.forceX(boxW / 2).strength(0.045))
      .force('y', d3.forceY(boxH / 2).strength(0.045))
    // Give the layout enough ticks to spread out before it freezes.
    simulation.alphaDecay(0.018)

    const link = container
      .select('.links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.34)

    const degreeMap: Record<number, number> = {}
    links.forEach((l) => {
      const source = endpointId(l.source as never)
      const target = endpointId(l.target as never)
      degreeMap[source] = (degreeMap[source] || 0) + 1
      degreeMap[target] = (degreeMap[target] || 0) + 1
    })

    const node = container
      .select('.nodes')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      // sqrt keeps hub radii readable without letting them swallow the canvas.
      .attr('r', (d: any) => nodeRadius(degreeMap[(d as any).id] || 0))
      // Hubs (degree > 4) pick up the secondary accent, leaves the primary one.
      .attr('fill', (d: any) =>
        (degreeMap[(d as any).id] && degreeMap[(d as any).id] > 4)
          ? 'var(--site-secondary)'
          : 'var(--site-accent)',
      )
      .attr('stroke', 'var(--console-bg)')
      .attr('stroke-boxW', 1)
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
        d3.select(this).transition().duration(120).attr('r', nodeRadius(deg) * 1.5)
        // dim others
  container.selectAll('.nodes circle').filter(function (this: any) { return this !== event.target }).transition().duration(120).style('opacity', 0.25)
        // highlight connected links
        container.selectAll('.links line').transition().duration(120)
          .style('stroke-opacity', (l: any) => (endpointId(l.source) === nid || endpointId(l.target) === nid ? 1 : 0.08))
          .style('stroke', (l: any) => (endpointId(l.source) === nid || endpointId(l.target) === nid ? 'var(--console-accent)' : 'currentColor'))
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
  d3.select(this).transition().duration(120).attr('r', nodeRadius(deg))
        container.selectAll('.nodes circle').transition().duration(120).style('opacity', 1)
        container.selectAll('.links line').transition().duration(120).style('stroke-opacity', 0.34).style('stroke', 'currentColor')
        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      } catch (err) { void err }
    })

  node.append('title').text((d: any) => `ID: ${(d as any).id}\ndeg: ${degreeMap[(d as any).id] || 0}`)

    const margin = 26
    simulation.nodes(nodes as any).on('tick', () => {
      // Gently clamp positions so spread-out layouts stay inside the frame.
      for (const n of nodes as any[]) {
        n.x = Math.max(margin, Math.min(boxW - margin, n.x))
        n.y = Math.max(margin, Math.min(boxH - margin, n.y))
      }
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
  }, [nodes, links, isAnimating, boxW, boxH])

  return (
    <div className="network-graph" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${boxW} ${boxH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Barabási–Albert network graph"
      />
      <div className="network-tooltip" ref={tooltipRef} />
    </div>
  )
}

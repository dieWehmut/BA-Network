// Minimal d3 module declaration to satisfy TypeScript when @types/d3 is not installed.
// This keeps the build working on environments like Vercel. For better typing,
// install `@types/d3` and remove/replace this file.

declare module 'd3' {
  const d3: any
  export = d3
}

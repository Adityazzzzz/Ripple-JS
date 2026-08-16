/**
 * Ripple.js Performance Benchmarks
 * 
 * Run: node --loader ts-node/esm benchmarks/bench.ts
 * Or:  npx tsx benchmarks/bench.ts
 * 
 * Compares Ripple.js against:
 * - @preact/signals-core
 * - @vue/reactivity
 */

// ============================================================
// Benchmark Harness
// ============================================================

interface BenchResult {
  name: string;
  ops: number;
  timeMs: number;
  opsPerSec: string;
}

function bench(name: string, fn: () => void, iterations = 100_000): BenchResult {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();

  const timeMs = end - start;
  const opsPerSec = ((iterations / timeMs) * 1000).toFixed(0);

  return { name, ops: iterations, timeMs, opsPerSec };
}

function printResults(category: string, results: BenchResult[]) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${category}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(
    '  ' +
    'Library'.padEnd(25) +
    'Ops'.padStart(12) +
    'Time (ms)'.padStart(12) +
    'Ops/sec'.padStart(15)
  );
  console.log(`  ${'─'.repeat(64)}`);

  // Sort by ops/sec descending
  results.sort((a, b) => parseFloat(b.opsPerSec) - parseFloat(a.opsPerSec));

  const fastest = parseFloat(results[0].opsPerSec);

  for (const r of results) {
    const ratio = (parseFloat(r.opsPerSec) / fastest * 100).toFixed(0);
    const bar = r === results[0] ? ' 🏆' : ` (${ratio}%)`;
    console.log(
      '  ' +
      r.name.padEnd(25) +
      r.ops.toLocaleString().padStart(12) +
      r.timeMs.toFixed(2).padStart(12) +
      r.opsPerSec.padStart(15) +
      bar
    );
  }
}

// ============================================================
// Load Libraries
// ============================================================

async function run() {
  console.log('🌊 Ripple.js Performance Benchmarks');
  console.log(`   Node ${process.version} | ${process.platform} ${process.arch}`);
  console.log(`   Date: ${new Date().toISOString()}`);

  // Dynamic imports to handle missing packages gracefully
  const ripple = await import('../src/index.js');

  let preact: any = null;
  let vue: any = null;

  try {
    preact = await import('@preact/signals-core');
  } catch {
    console.log('\n⚠️  @preact/signals-core not installed — skipping');
  }

  try {
    vue = await import('@vue/reactivity');
  } catch {
    console.log('⚠️  @vue/reactivity not installed — skipping');
  }

  // ============================================================
  // 1. Signal Creation
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 100_000;

    results.push(bench('Ripple.js', () => {
      ripple.signal(0);
    }, N));

    if (preact) {
      results.push(bench('@preact/signals', () => {
        preact.signal(0);
      }, N));
    }

    if (vue) {
      results.push(bench('@vue/reactivity', () => {
        vue.ref(0);
      }, N));
    }

    printResults('Signal Creation (100K signals)', results);
  }

  // ============================================================
  // 2. Signal Read/Write
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 1_000_000;

    {
      const s = ripple.signal(0);
      results.push(bench('Ripple.js', () => {
        s.value = s.value + 1;
      }, N));
    }

    if (preact) {
      const s = preact.signal(0);
      results.push(bench('@preact/signals', () => {
        s.value = s.value + 1;
      }, N));
    }

    if (vue) {
      const s = vue.ref(0);
      results.push(bench('@vue/reactivity', () => {
        s.value = s.value + 1;
      }, N));
    }

    printResults('Signal Read + Write (1M operations)', results);
  }

  // ============================================================
  // 3. Computed Evaluation
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 500_000;

    {
      const a = ripple.signal(0);
      const b = ripple.signal(0);
      const c = ripple.computed(() => a.value + b.value);
      results.push(bench('Ripple.js', () => {
        a.value++;
        c.value; // force evaluation
      }, N));
    }

    if (preact) {
      const a = preact.signal(0);
      const b = preact.signal(0);
      const c = preact.computed(() => a.value + b.value);
      results.push(bench('@preact/signals', () => {
        a.value++;
        c.value;
      }, N));
    }

    if (vue) {
      const a = vue.ref(0);
      const b = vue.ref(0);
      const c = vue.computed(() => a.value + b.value);
      results.push(bench('@vue/reactivity', () => {
        a.value++;
        c.value;
      }, N));
    }

    printResults('Computed Evaluation (500K updates)', results);
  }

  // ============================================================
  // 4. Effect Triggering (fan-out)
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 50_000;
    const EFFECTS = 100;

    {
      const s = ripple.signal(0);
      const disposers: any[] = [];
      for (let i = 0; i < EFFECTS; i++) {
        disposers.push(ripple.effect(() => { s.value; }));
      }
      results.push(bench('Ripple.js', () => {
        s.value++;
      }, N));
      disposers.forEach(d => d());
    }

    if (preact) {
      const s = preact.signal(0);
      const disposers: any[] = [];
      for (let i = 0; i < EFFECTS; i++) {
        disposers.push(preact.effect(() => { s.value; }));
      }
      results.push(bench('@preact/signals', () => {
        s.value++;
      }, N));
      disposers.forEach(d => d());
    }

    if (vue) {
      const s = vue.ref(0);
      const runners: any[] = [];
      for (let i = 0; i < EFFECTS; i++) {
        const runner = vue.effect(() => { s.value; });
        runners.push(runner);
      }
      results.push(bench('@vue/reactivity', () => {
        s.value++;
      }, N));
      runners.forEach((r: any) => r.effect?.stop?.());
    }

    printResults(`Effect Fan-out (${EFFECTS} effects × ${N.toLocaleString()} writes)`, results);
  }

  // ============================================================
  // 5. Diamond Dependency Pattern
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 200_000;

    {
      const s = ripple.signal(0);
      const a = ripple.computed(() => s.value * 2);
      const b = ripple.computed(() => s.value * 3);
      const c = ripple.computed(() => a.value + b.value);
      results.push(bench('Ripple.js', () => {
        s.value++;
        c.value;
      }, N));
    }

    if (preact) {
      const s = preact.signal(0);
      const a = preact.computed(() => s.value * 2);
      const b = preact.computed(() => s.value * 3);
      const c = preact.computed(() => a.value + b.value);
      results.push(bench('@preact/signals', () => {
        s.value++;
        c.value;
      }, N));
    }

    if (vue) {
      const s = vue.ref(0);
      const a = vue.computed(() => s.value * 2);
      const b = vue.computed(() => s.value * 3);
      const c = vue.computed(() => a.value + b.value);
      results.push(bench('@vue/reactivity', () => {
        s.value++;
        c.value;
      }, N));
    }

    printResults('Diamond Dependency (200K updates)', results);
  }

  // ============================================================
  // 6. Batch Performance
  // ============================================================
  {
    const results: BenchResult[] = [];
    const N = 100_000;

    {
      const signals = Array.from({ length: 10 }, () => ripple.signal(0));
      results.push(bench('Ripple.js', () => {
        ripple.batch(() => {
          for (const s of signals) s.value++;
        });
      }, N));
    }

    if (preact) {
      const signals = Array.from({ length: 10 }, () => preact.signal(0));
      results.push(bench('@preact/signals', () => {
        preact.batch(() => {
          for (const s of signals) s.value++;
        });
      }, N));
    }

    // Vue doesn't have a batch API — skip

    printResults('Batch Write (10 signals × 100K batches)', results);
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  Benchmark complete!');
  console.log(`${'═'.repeat(70)}\n`);
}

run().catch(console.error);

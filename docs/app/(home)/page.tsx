import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center px-4 bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <div className="space-y-8 max-w-3xl">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          v1.0.0 is now live
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-6">
          Reactivity, <span className="text-blue-500">Unbound.</span>
        </h1>
        
        <p className="text-lg text-muted-foreground sm:text-xl leading-relaxed">
          A framework-agnostic, zero-dependency reactive utility library. 
          Build fine-grained, glitch-free state graphs in Node.js, Web Workers, or vanilla JavaScript with a ~3.5KB footprint.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link 
            href="/docs/getting-started" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
          >
            Read the Docs
          </Link>
          <Link 
            href="https://github.com/your-repo/ripple-reactive" 
            target="_blank"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
          >
            View on GitHub
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 text-left">
          <div className="space-y-2">
            <h3 className="font-bold">Framework Agnostic</h3>
            <p className="text-sm text-muted-foreground">Extracts the power of modern UI signals into a standalone engine. Adapters for React, Vue, and Svelte included.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold">Glitch-Free</h3>
            <p className="text-sm text-muted-foreground">Push-pull hybrid architecture guarantees zero intermediate stale states and strictly controls memory footprint.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold">Batteries Included</h3>
            <p className="text-sm text-muted-foreground">Deeply reactive stores, automatic undo/redo history tracking, and localStorage persistence built right in.</p>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-sm text-muted-foreground">
        Built by ADITYA SING.
      </footer>
    </main>
  );
}
import Link from 'next/link';

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-slate-900 text-base tracking-tight">
          Her<span className="text-violet-600">Money</span>Moves
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/resume" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
            Resume Grader
          </Link>
          <Link href="/negotiate" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
            Negotiate
          </Link>
          <Link href="/invest" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
            Invest
          </Link>
          <Link
            href="/"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}

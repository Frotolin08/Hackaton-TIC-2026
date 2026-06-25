
export function LobbySkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
      {/* GLOW BAR */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl h-56 flex flex-col gap-4">
        <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
        <div className="h-8 bg-zinc-800 rounded w-2/3"></div>
        <div className="h-4 bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
      </div>

      {/* MODES LIST */}
      <div className="flex flex-col gap-3">
        <div className="h-5 bg-zinc-800 rounded w-1/5 mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-24 flex gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex-shrink-0"></div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GamePlaySkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-pulse">
      <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl"></div>
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl h-72 flex flex-col gap-6 justify-center">
        <div className="h-6 bg-zinc-800 rounded w-3/4 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-14 bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}


import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold tracking-tight mb-4">Transit Shark</h1>
      <p className="text-lg text-gray-400 mb-10">
        Real-time transit exploration for Boston&#39;s MBTA network.
      </p>
      <Link
        href="/app"
        className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
      >
        Launch App
      </Link>
    </div>
  );
}

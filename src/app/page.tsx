import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

        <nav style={{ padding: 20 }}>
          <Link href="/pages/page-1">Page 1</Link> |{" "}
          <Link href="/pages/page-2">Page 2</Link>
          <Link href="/pages/page-3">Page 3</Link>
          <Link href="/pages/page-4">Page 4</Link>
          <Link href="/pages/page-5">Page 5</Link>

        </nav>

        <h1 className="text-2xl font-bold">This is Home Page</h1>

      </main>
    </div>
  );
}

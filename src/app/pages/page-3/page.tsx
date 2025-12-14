'use client';
// 1. Import dynamic from next/dynamic
import dynamic from 'next/dynamic';

// 2. Import your Game/App component dynamically
// ssr: false is the key here!
const Baccarat = dynamic(() => import('@/components/Baccarat/Baccarat'), { 
  ssr: false,
  loading: () => <p>Loading Game...</p> // Optional loading text
});


const Page = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main>
            <Baccarat />
        </main>
        </div>
    );
}
export default Page;
import HorseRacing from "@/components/HorseRacing/HorseRacing";
import TrackSquareRace from "@/components/HorseRacing/TrackSquareRace";


const Page = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main>
            <TrackSquareRace />
        </main>
        </div>
    );
}
export default Page;
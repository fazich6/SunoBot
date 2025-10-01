import SunoBot from '@/components/SunoBot';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md h-full md:h-[90vh] md:max-h-[800px] bg-background md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative font-body">
        <SunoBot />
      </div>
    </main>
  );
}

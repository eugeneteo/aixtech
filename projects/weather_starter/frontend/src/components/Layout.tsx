import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { ThemeSelector } from './ThemeSelector';

export function Layout() {
  return (
    <div className="relative flex h-full min-h-screen w-full">
      <Sidebar />
      <Hero />
      <div className="absolute right-4 top-4 z-[500]">
        <ThemeSelector />
      </div>
    </div>
  );
}

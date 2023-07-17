import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/theme-provider';

export default function ModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon
            className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
            }`}
          />
          <MoonIcon
            className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toggleTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleTheme('dark')}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

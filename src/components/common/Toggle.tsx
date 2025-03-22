import { Switch } from '@headlessui/react';
import { motion } from 'framer-motion';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Toggle({ 
  enabled, 
  onChange, 
  disabled = false,
  size = 'md',
  color = '#1DB954'
}: ToggleProps) {
  const sizes = {
    sm: {
      switch: 'h-5 w-9',
      dot: 'h-3 w-3',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'h-6 w-11',
      dot: 'h-4 w-4',
      translate: 'translate-x-6',
    },
    lg: {
      switch: 'h-7 w-14',
      dot: 'h-5 w-5',
      translate: 'translate-x-8',
    },
  };

  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      disabled={disabled}
      className={`
        relative inline-flex shrink-0 cursor-pointer rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white
        focus-visible:ring-opacity-75
        ${sizes[size].switch}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${enabled ? `bg-[${color}]` : 'bg-[#323232]'}
      `}
    >
      <motion.span
        layout
        className={`
          ${sizes[size].dot}
          pointer-events-none inline-block transform rounded-full
          bg-white shadow-lg ring-0
          ${enabled ? sizes[size].translate : 'translate-x-1'}
        `}
        animate={{
          scale: enabled ? 1.05 : 1,
          rotate: enabled ? 180 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </Switch>
  );
} 
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap border border-transparent bg-clip-padding font-semibold uppercase tracking-[0.08em] text-[#0A0A0A] transition-colors outline-none select-none focus-visible:border-[#0A0A0A] focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default: 'bg-[#0A0A0A] text-white hover:bg-[#1F2937]',
                outline:
                    'border-2 border-[#0A0A0A] bg-transparent text-[#0A0A0A] hover:bg-[#F3F4F6]',
                secondary: 'bg-[#F3F4F6] text-[#0A0A0A] hover:bg-[#E5E7EB]',
                ghost: 'bg-transparent text-[#0A0A0A] hover:bg-[#F3F4F6]',
                destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
                link: 'border-transparent px-0 text-[#2563EB] underline-offset-4 hover:underline',
            },
            size: {
                default:
                    'h-10 gap-2 px-6 text-[14px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
                xs: 'h-8 gap-1.5 px-4 text-[12px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*=size-])]:size-3',
                sm: 'h-8 gap-1.5 px-4 text-[14px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*=size-])]:size-3.5',
                lg: 'h-12 gap-2 px-8 text-[16px] has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7',
                icon: 'size-8',
                'icon-xs': 'size-8 [&_svg:not([class*=size-])]:size-3',
                'icon-sm': 'size-8',
                'icon-lg': 'size-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

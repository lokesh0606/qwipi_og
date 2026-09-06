import { useBranding } from '../contexts/BrandingContext';

interface BrandedTextProps {
    className?: string;
}

export const BrandedText = ({ className = "" }: BrandedTextProps) => {
    const { appName } = useBranding();
    return (
        <span className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 font-bold bg-[length:200%_auto] animate-gradient ${className}`}>
            {appName}
        </span>
    );
};

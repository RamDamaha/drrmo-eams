// The ZPPSU and DRRMO logos side by side. ZPPSU (the university) always comes first.
const sizes = { sm: 'size-9', md: 'size-12', lg: 'size-16' };

export function BrandLogos({
    size = 'md',
    className = '',
}: {
    size?: keyof typeof sizes;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/images/brand/zppsu-logo.webp"
                alt="Zamboanga Peninsula Polytechnic State University logo"
                width={250}
                height={250}
                className={`${sizes[size]} object-contain`}
            />
            <span className="h-8 w-px bg-current opacity-25" aria-hidden="true" />
            <img
                src="/images/brand/drrmo-logo.webp"
                alt="ZPPSU Disaster Risk Reduction and Management Office logo"
                width={288}
                height={320}
                className={`${sizes[size]} object-contain`}
            />
        </div>
    );
}

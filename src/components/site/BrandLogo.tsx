export function BrandLogo({ className }: { className: string }) {
  return (
    <img
      src="/favicon.png"
      alt="CleanLink"
      className={`${className} rounded-[8px]`}
    />
  );
}
interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const KharchwiseLogo = ({ size = 'sm' }: Props) => {
  const heightClass = size === 'lg' ? 'h-12' : 'h-7';
  return (
    <div className={`flex items-center justify-center ${heightClass}`}>
      <img src="/logo.png" alt="Kharchwise" className="h-full w-auto object-contain scale-[1.4]" />
    </div>
  );
};

export default KharchwiseLogo;

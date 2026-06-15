interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const KharchwiseLogo = ({ size = 'sm' }: Props) => {
  const heightClass = size === 'lg' ? 'h-10' : 'h-6';
  return (
    <div className={`flex items-center ${heightClass}`}>
      <img src="/logo.png" alt="Kharchwise" className="h-[200%] w-auto object-contain scale-[1.5] origin-left" />
    </div>
  );
};

export default KharchwiseLogo;

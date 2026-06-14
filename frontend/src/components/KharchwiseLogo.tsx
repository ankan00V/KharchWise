interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const KharchwiseLogo = ({ size = 'sm' }: Props) => {
  const widthClass = size === 'lg' ? 'w-48' : 'w-32';
  return (
    <div className={`flex items-center ${widthClass}`}>
      <img src="/logo.png" alt="Kharchwise" className="w-full h-auto object-contain" />
    </div>
  );
};

export default KharchwiseLogo;

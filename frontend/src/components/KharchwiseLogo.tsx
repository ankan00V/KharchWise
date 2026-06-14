interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const KharchwiseLogo = ({ size = 'sm', showLabel = true }: Props) => {
  const textSize = size === 'lg' ? 'text-[32px] leading-[1.18]' : 'text-[24px] leading-[1.33]';
  const tracking = size === 'lg' ? 'tracking-[-0.96px]' : 'tracking-[-0.72px]';
  return (
    <div className="flex items-center gap-8 font-sans font-semibold">
      <span className={`${textSize} ${tracking} text-electric-blue`}>₹</span>
      {showLabel && (
        <span className={`${textSize} ${tracking} text-midnight-navy`}>
          Kharchwise
        </span>
      )}
    </div>
  );
};

export default KharchwiseLogo;

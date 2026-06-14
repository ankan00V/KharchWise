interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const KharchwiseLogo = ({ size = 'sm', showLabel = true }: Props) => {
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';
  return (
    <div className="flex items-center gap-2">
      <span className={`${textSize} font-bold`}>
        <span className="text-[#5bc5a7]">₹</span>
      </span>
      {showLabel && (
        <span className={`${textSize} font-bold tracking-tight`}>
          <span className="text-[#5bc5a7]">Kharch</span>
          <span className="text-gray-800">wise</span>
        </span>
      )}
    </div>
  );
};

export default KharchwiseLogo;

interface Props {
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const KharchwiseLogo = ({ size = 'sm' }: Props) => {
  const { user } = useAuth();
  const heightClass = size === 'lg' ? 'h-16' : 'h-9';
  
  return (
    <Link to={user ? "/groups" : "/"} className={`flex items-center justify-center ${heightClass} no-underline hover:opacity-80 transition-opacity`}>
      <img src="/logo.png" alt="Kharchwise" className="h-full w-auto object-contain scale-[1.6]" />
    </Link>
  );
};

export default KharchwiseLogo;

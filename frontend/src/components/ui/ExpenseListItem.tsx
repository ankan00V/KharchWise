import { format } from 'date-fns';
import { motion } from 'framer-motion';

type Props = {
  expense: any;
  currentUserId?: number;
  onClick?: () => void;
};

export const ExpenseListItem = ({ expense, currentUserId, onClick }: Props) => {
  const date = new Date(expense.date);
  const monthStr = format(date, 'MMM');
  const dayStr = format(date, 'd');

  const mySplit = expense.splits?.find((s: any) => s.user_id === currentUserId);
  const iPaid = expense.paid_by_id === currentUserId;
  const isSettlement = expense.split_type === 'SETTLEMENT';
  const isDeleted = !!expense.deleted_at;

  let rightLabel = "not involved";
  let rightAmount = "";
  let rightColorClass = "text-[rgba(255,255,255,0.5)]"; // default

  if (isSettlement) {
    if (iPaid) {
      rightLabel = "you paid";
      rightAmount = `₹${Number(expense.amount_inr || expense.amount).toFixed(2)}`;
      rightColorClass = "text-[#3CE370]"; // Fold Green
    } else if (mySplit) {
      rightLabel = "you received";
      rightAmount = `₹${Number(mySplit.share_amount).toFixed(2)}`;
      rightColorClass = "text-[#3CE370]";
    } else {
      rightLabel = "settlement";
      rightAmount = `₹${Number(expense.amount_inr || expense.amount).toFixed(2)}`;
      rightColorClass = "text-[rgba(255,255,255,0.7)]";
    }
  } else {
    if (iPaid) {
      rightLabel = "you lent";
      const myShare = mySplit ? Number(mySplit.share_amount) : 0;
      const lentAmount = Number(expense.amount_inr || expense.amount) - myShare;
      rightAmount = `₹${Math.abs(lentAmount).toFixed(2)}`;
      rightColorClass = lentAmount > 0 ? "text-[#3CE370]" : "text-[rgba(255,255,255,0.7)]";
    } else if (mySplit) {
      rightLabel = "you borrowed";
      rightAmount = `₹${Number(mySplit.share_amount).toFixed(2)}`;
      rightColorClass = "text-[#FF4A00]"; // Vibrant Orange for owing
    }
  }

  return (
    <motion.div 
      whileHover={{ scale: 0.99, backgroundColor: "rgba(255,255,255,0.06)" }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-between p-4 sm:p-6 border-b border-[rgba(255,255,255,0.05)] last:border-0 cursor-pointer transition-colors rounded-xl ${isDeleted ? 'opacity-40' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-[24px]">
        <div className="flex flex-col items-center justify-center w-[48px]">
          <span className="text-[12px] uppercase font-sans font-semibold text-[rgba(255,255,255,0.5)] tracking-[0.5px]">{monthStr}</span>
          <span className="text-[24px] font-sans font-bold text-white tracking-tight leading-none">{dayStr}</span>
        </div>
        
        <div className="w-[48px] h-[48px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl flex items-center justify-center text-[24px] shadow-inner">
          {isSettlement ? '💸' : '🧾'}
        </div>

        <div className="flex flex-col">
          <span className="font-sans font-bold text-[18px] text-[rgba(255,255,255,0.95)] tracking-tight truncate max-w-[180px] sm:max-w-xs">{expense.description}</span>
          {expense.paid_by_id ? (
            <span className="text-[13px] font-sans font-medium text-[rgba(255,255,255,0.5)] mt-0.5">
              {iPaid ? 'you' : expense.paid_by?.name || expense.paid_by?.canonical_name || 'someone'} paid ₹{Number(expense.amount_inr || expense.amount).toFixed(2)}
            </span>
          ) : (
            <span className="text-[13px] font-sans font-bold text-[#FF4A00] mt-0.5">Missing Payer</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end min-w-[90px]">
        {rightAmount ? (
          <>
            <span className="text-[11px] font-sans font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px] mb-1">{rightLabel}</span>
            <span className={`font-sans font-bold text-[18px] tracking-tight ${rightColorClass}`}>{rightAmount}</span>
          </>
        ) : (
          <span className="text-[13px] font-sans font-semibold text-[rgba(255,255,255,0.4)] tracking-wide">not involved</span>
        )}
      </div>
    </motion.div>
  );
};

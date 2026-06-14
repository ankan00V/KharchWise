
import { format } from 'date-fns';

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
  let rightColorClass = "text-gray-400";

  if (isSettlement) {
    if (iPaid) {
      rightLabel = "you paid";
      rightAmount = `₹${Number(expense.amount_inr || expense.amount).toFixed(2)}`;
      rightColorClass = "text-[#5bc5a7]";
    } else if (mySplit) {
      rightLabel = "you received";
      rightAmount = `₹${Number(mySplit.share_amount).toFixed(2)}`;
      rightColorClass = "text-[#ff652f]";
    } else {
      rightLabel = "settlement";
      rightAmount = `₹${Number(expense.amount_inr || expense.amount).toFixed(2)}`;
      rightColorClass = "text-gray-500";
    }
  } else {
    if (iPaid) {
      rightLabel = "you lent";
      const myShare = mySplit ? Number(mySplit.share_amount) : 0;
      const lentAmount = Number(expense.amount_inr || expense.amount) - myShare;
      rightAmount = `₹${Math.abs(lentAmount).toFixed(2)}`;
      rightColorClass = lentAmount > 0 ? "text-[#5bc5a7]" : "text-gray-500";
    } else if (mySplit) {
      rightLabel = "you borrowed";
      rightAmount = `₹${Number(mySplit.share_amount).toFixed(2)}`;
      rightColorClass = "text-[#ff652f]";
    }
  }

  return (
    <div 
      className={`flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${isDeleted ? 'opacity-40' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-12 text-gray-500">
          <span className="text-xs uppercase font-medium">{monthStr}</span>
          <span className="text-xl font-light leading-none">{dayStr}</span>
        </div>
        
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg">
          {isSettlement ? '💸' : '🧾'}
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{expense.description}</span>
          {expense.paid_by_id ? (
            <span className="text-xs text-gray-500">
              {iPaid ? 'you' : expense.paid_by?.name || expense.paid_by?.canonical_name || 'someone'} paid ₹{Number(expense.amount_inr || expense.amount).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-red-500 font-medium">Missing Payer</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end min-w-[90px]">
        {rightAmount ? (
          <>
            <span className="text-xs text-gray-500">{rightLabel}</span>
            <span className={`font-medium ${rightColorClass}`}>{rightAmount}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">not involved</span>
        )}
      </div>
    </div>
  );
};

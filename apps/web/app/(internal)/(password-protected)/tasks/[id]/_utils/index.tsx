import { AlertCircle, CheckCircle2, Clock, Hourglass, XCircle } from 'lucide-react';
import { TaskState } from '../../../../../../types/tasks/task-state.enum';

export const formatCryptoAmount = (amount: string) => {
  // Convert from wei to IP (or appropriate token)
  const ethValue = parseInt(amount) / 1e18;
  return ethValue.toFixed(6) + ' IP';
};

export const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getTaskStateLabel = (state: TaskState) => {
  switch (state) {
    case TaskState.PENDING:
      return { label: 'Pending', color: 'text-yellow-400', icon: <Clock className="h-5 w-5" /> };
    case TaskState.INVITED:
      return {
        label: 'Invitation',
        color: 'text-blue-400',
        icon: <Hourglass className="h-5 w-5" />,
      };
    case TaskState.ASSIGNED:
      return {
        label: 'Assigned',
        color: 'text-indigo-400',
        icon: <Hourglass className="h-5 w-5" />,
      };
    case TaskState.SUBMITTED:
      return {
        label: 'Awaiting Approval',
        color: 'text-orange-400',
        icon: <AlertCircle className="h-5 w-5" />,
      };
    case TaskState.DISPUTED_BY_AGENT:
      return {
        label: 'In Dispute',
        color: 'text-red-400',
        icon: <XCircle className="h-5 w-5" />,
      };
    case TaskState.DISPUTED_BY_OWNER:
      return {
        label: 'In Dispute',
        color: 'text-red-400',
        icon: <XCircle className="h-5 w-5" />,
      };
    case TaskState.COMPLETED:
      return {
        label: 'Completed',
        color: 'text-green-400',
        icon: <CheckCircle2 className="h-5 w-5" />,
      };
    case TaskState.DELETED:
      return { label: 'Deleted', color: 'text-gray-400', icon: <XCircle className="h-5 w-5" /> };
    case TaskState.RESOLVED:
      return {
        label: 'Resolved',
        color: 'text-green-400',
        icon: <CheckCircle2 className="h-5 w-5" />,
      };
    case TaskState.VALIDATED:
      return {
        label: 'Validated',
        color: 'text-green-400',
        icon: <CheckCircle2 className="h-5 w-5" />,
      };
    case TaskState.DECLINED_BY_OWNER:
      return {
        label: 'Declined by Owner',
        color: 'text-red-400',
        icon: <XCircle className="h-5 w-5" />,
      };
    case TaskState.DECLINED_BY_VALIDATOR:
      return {
        label: 'Declined by Validator',
        color: 'text-red-400',
        icon: <XCircle className="h-5 w-5" />,
      };
    case TaskState.EXPIRED:
      return {
        label: 'Expired',
        color: 'text-gray-400',
        icon: <Clock className="h-5 w-5" />,
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-400',
        icon: <AlertCircle className="h-5 w-5" />,
      };
  }
};

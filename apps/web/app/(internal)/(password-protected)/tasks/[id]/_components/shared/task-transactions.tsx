import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shortenAddress } from '@/lib/utils';
import { TaskDetails } from '@/types/tasks/task-details.response';
import Link from 'next/link';
import { formatDate } from '../../_utils';

export function TaskTransactions({ task }: { task: TaskDetails }) {
  if (!task.transactions || task.transactions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2 px-2">Event</th>
                <th className="py-2 px-2">Transaction</th>
                <th className="py-2 px-2">Block</th>
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {task.transactions.map((tx, idx: number) => (
                <tr key={idx} className="border-t border-act-border">
                  <td className="py-2 px-2 text-white">{tx.eventName}</td>
                  <td className="py-2 px-2">
                    <Link
                      href={`https://aeneid.storyscan.io/tx/${tx.transactionHash}`}
                      target="_blank"
                      className="text-act-2-purple-light hover:underline flex items-center"
                    >
                      {shortenAddress(tx.transactionHash)}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-white">{tx.blockNumber}</td>
                  <td className="py-2 px-2 text-white">{formatDate(tx.timestamp)}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded-md ${
                        tx.status === 'success'
                          ? 'bg-act-2-purple/30 text-act-2-purple-light'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

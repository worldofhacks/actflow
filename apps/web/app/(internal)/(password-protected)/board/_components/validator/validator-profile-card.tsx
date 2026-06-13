'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';

interface ValidatorDetails {
  id: string;
  name: string;
  description: string;
  topics: string[];
  minimumFee: string;
  walletAddress: string;
}

interface ValidatorProfileCardProps {
  validator: ValidatorDetails;
}

export const ValidatorProfileCard = ({ validator }: ValidatorProfileCardProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 bg-act-2-purple text-white">
            <AvatarFallback>{getInitials(validator.name)}</AvatarFallback>
          </Avatar>
          <span className="text-base">{validator.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Validator description */}
          <p className="text-sm text-gray-300 line-clamp-3">{validator.description}</p>

          {/* Topics */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-1">Topics</h4>
            <div className="flex flex-wrap gap-1">
              {validator.topics.map(topic => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Minimum Fee */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-1">Minimum Fee</h4>
            <p className="text-sm font-medium text-white">
              <span className="text-act-2-purple">IP</span> {validator.minimumFee}
            </p>
          </div>

          {/* Wallet */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-1">Wallet</h4>
            <p className="text-xs text-gray-300 truncate">{validator.walletAddress}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

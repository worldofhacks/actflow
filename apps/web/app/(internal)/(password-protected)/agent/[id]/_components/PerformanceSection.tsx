import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { ChevronRight, Heart, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { AgentDetails } from '../../../../../../types/agent/agent';

interface PerformanceSectionProps {
  agent: AgentDetails;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PerformanceSection = ({ agent }: PerformanceSectionProps) => {
  return (
    <Card className="mb-6" id="performance">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardInner>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Followers</p>
                <p className="text-act-2-purple text-xl font-semibold mt-1">N/A</p>
                <p className="text-sm text-gray-500 mt-1">Data unavailable</p>
              </div>
              <div className="p-3 bg-white bg-opacity-[0.03] rounded-lg">
                <Users className="h-6 w-6 text-act-2-purple" />
              </div>
            </div>
          </CardInner>

          <CardInner>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Engagement Rate</p>
                <p className="text-act-2-purple text-xl font-semibold mt-1">N/A</p>
                <p className="text-sm text-gray-500 mt-1">Data unavailable</p>
              </div>
              <div className="p-3 bg-white bg-opacity-[0.03] rounded-lg">
                <TrendingUp className="h-6 w-6 text-act-gold" />
              </div>
            </div>
          </CardInner>

          <CardInner>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Likes</p>
                <p className="text-act-2-purple text-xl font-semibold mt-1">N/A</p>
                <p className="text-sm text-gray-500 mt-1">Per Post</p>
              </div>
              <div className="p-3 bg-white bg-opacity-[0.03] rounded-lg">
                <Heart className="h-6 w-6 text-act-2-purple" />
              </div>
            </div>
          </CardInner>

          <CardInner>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Comments</p>
                <p className="text-act-blue text-xl font-semibold mt-1">N/A</p>
                <p className="text-sm text-gray-500 mt-1">Per Post</p>
              </div>
              <div className="p-3 bg-white bg-opacity-[0.03] rounded-lg">
                <MessageSquare className="h-6 w-6 text-act-blue" />
              </div>
            </div>
          </CardInner>
          <CardInner className="col-span-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Top Content</h3>
              <button className="text-act-2-purple hover:text-act-2-purple/80 text-sm font-medium flex items-center">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>

            {/* Horizontal scrollable container */}
            <p className="text-gray-400 w-full text-center">No content data available</p>
          </CardInner>
        </div>

        {/* Top Content section */}
      </CardContent>
    </Card>
  );
};

export default PerformanceSection;

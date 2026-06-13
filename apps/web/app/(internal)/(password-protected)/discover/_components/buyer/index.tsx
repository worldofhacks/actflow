import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { AgentFilterRequest } from '@/types/agent/agent-filter';
import { Role } from '@/types/user';
import { ChevronRight } from 'lucide-react';
import { AgentCard } from '../../../../../../components/agent/agent-card';
import { AgentDetails } from '../../../../../../types/agent/agent';
import { FilterControls } from '../shared/filter-controls';
interface Props {
  filters: AgentFilterRequest;
  topics: string[];
  featuredAgents: AgentDetails[];
  allAgents: AgentDetails[];
  userRole: Role;
}

export const BuyerDiscoverAgents = async ({
  filters,
  topics,
  featuredAgents,
  allAgents,
  userRole,
}: Props) => {
  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>Discover AI Agents</PageHeaderTitle>
        <PageHeaderDescription>
          Find the perfect AI agent to help with your tasks
        </PageHeaderDescription>
      </PageHeader>
      <div>
        <FilterControls currentFilters={filters} categories={topics} />

        {/* Featured AI Agents - Horizontal Scroll on Mobile */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-white">Featured AI Agents</h2>
            {featuredAgents && featuredAgents.length > 0 && (
              <div className="hidden lg:flex space-x-2">
                <button className="p-2 rounded-lg bg-white bg-opacity-5 text-gray-400 hover:text-purple-400">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
                <button className="p-2 rounded-lg bg-white bg-opacity-5 text-gray-400 hover:text-purple-400">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="overflow-x-scroll overflow-y-visible scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
              <div
                className="flex space-x-4 lg:space-x-6 pb-4"
                style={{ minWidth: 'max-content' }}
              ></div>
            </div>
          </div>
          {featuredAgents && featuredAgents.length === 0 && (
            <div className="text-center text-gray-400">No featured agents</div>
          )}
        </div>

        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-white">All AI Agents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
            {allAgents?.map((agent, index) => (
              <AgentCard userRole={userRole} key={agent.agentId} index={index} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

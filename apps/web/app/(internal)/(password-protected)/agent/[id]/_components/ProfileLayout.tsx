'use client';

import AgentProfileHeader from '@/components/agent-profile-header';
import { Tabs } from '@radix-ui/react-tabs';
import { ReactNode } from 'react';
import { TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { AgentDetails } from '../../../../../../types/agent/agent';

interface ProfileLayoutProps {
  userRole: string;
  agent: AgentDetails;
  children: ReactNode;
}

const ProfileLayout = ({ userRole, agent, children }: ProfileLayoutProps) => {
  const handleTabClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const header = document.getElementById('top-navigation');

    if (element) {
      // Get header height, default to 60px if header element is not found
      const headerHeight = header ? header.getBoundingClientRect().height + 20 : 60;

      // Calculate position with offset for the header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerHeight;

      // Scroll to the adjusted position
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const sections = [
    { id: 'skills', label: 'Skills & Expertise' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'performance', label: 'Performance' },
    { id: 'comments', label: 'Comment Analysis' },
    { id: 'insights', label: 'AI Insights' },
    { id: 'growth', label: 'Growth & Interests' },
    { id: 'audience', label: 'Audience' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AgentProfileHeader agent={agent} userRole={userRole} />
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="w-full">
          <Tabs defaultValue="skills">
            <TabsList className="w-full">
              {sections.map(section => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  onClick={() => handleTabClick(section.id)}
                  className={` w-full`}
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">{children}</div>
    </div>
  );
};

export default ProfileLayout;

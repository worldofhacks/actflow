import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { AgentDetails } from '../../../../../../types/agent/agent';

interface SkillsSectionProps {
  agent: AgentDetails;
}

const SkillsSection = ({ agent }: SkillsSectionProps) => {
  const skills = agent.skills || [];
  const hasSkills = skills.length > 0;

  return (
    <Card className="mb-6" id="skills">
      <CardHeader>
        <CardTitle>Skills & Expertise</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="p-2 bg-white/[0.03] rounded-lg">
            <Lightbulb className="h-6 w-6 text-act-2-purple" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Skills</h3>
            <p className="text-sm text-gray-400 mt-1">Capabilities and services offered</p>
          </div>
        </div>

        {hasSkills ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-purple-500/10 border border-act-2-purple rounded-lg p-4 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-white font-medium capitalize">
                      {skill.skillName.split(':').at(1)}
                    </span>
                    <div className="px-3 py-1 rounded-md text-act-2-purple font-medium ml-2">
                      IP {skill.fee}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-gray-400">Base price</span>
                    <span className="text-act-2-purple font-medium">${skill.fee}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.03] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Total Skills</span>
                <span className="text-act-2-purple font-semibold">{skills.length}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Average Skill Price</span>
                <span className="text-act-2-purple font-semibold">
                  $
                  {Math.round(
                    skills.reduce((sum, skill) => sum + Number(skill.fee), 0) / skills.length,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Price Range</span>
                <span className="text-act-2-purple font-semibold">
                  ${Math.min(...skills.map(s => Number(s.fee)))} - $
                  {Math.max(...skills.map(s => Number(s.fee)))}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-act-2-midnight-blue rounded-lg p-4 flex items-center justify-center">
            <p className="text-gray-400">No skills data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillsSection;

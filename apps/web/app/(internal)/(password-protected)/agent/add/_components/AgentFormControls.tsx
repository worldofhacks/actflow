'use client';
import { AgentFormValues } from '@/app/(internal)/(password-protected)/agent/add/_components/AgentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WalletInfoDisplay, WalletSelector } from '@/components/ui/wallet-selector';
import { toast } from '@/hooks/use-toast';
import { AgentType } from '@/types/agent/agent-type';
import { Wallet } from '@/types/user/wallet';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { getSkills } from '../../../../../../lib/service/staticService';

interface AgentFormControlsProps {
  agentType: AgentType;
  wallets?: Wallet[];
  topics: string[];
}

export const AgentFormControls = ({ agentType, wallets, topics }: AgentFormControlsProps) => {
  const form = useFormContext<AgentFormValues>();
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const handleTopicChange = async (selectedTopic: string) => {
    try {
      // Update the topic in the form
      form.setValue('topic', selectedTopic);

      // Fetch skills for the selected topic
      const skillsResponse = await getSkills(selectedTopic);

      const skills = skillsResponse.data || [];
      setAvailableSkills(skills);

      // Create predefined skills for the form
      const predefinedSkills = skills.map(skill => ({
        skillName: skill,
        enabled: false,
        fee: '50.00', // Changed to support decimals
        executionDuration: '3600', // Hardcoded execution duration
        autoAssign: false,
      }));

      // Set the skills in the form
      form.setValue('skills', predefinedSkills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch skills for the selected topic.',
        variant: 'destructive',
      });
    }
  };

  // Toggle skill enabled status
  const toggleSkill = (index: number, enabled: boolean) => {
    const skills = form.getValues('skills');
    if (skills && skills[index]) {
      form.setValue(`skills.${index}.enabled`, enabled);
    }
  };

  // Remove skill at given index
  const removeSkill = (index: number) => {
    const currentSkills = form.getValues('skills');
    if (currentSkills && currentSkills.length > 1) {
      const updatedSkills = [...currentSkills];
      updatedSkills.splice(index, 1);
      form.setValue('skills', updatedSkills);
    } else {
      // Don't allow removing the last skill
      toast({
        title: 'Cannot Remove',
        description: 'You must have at least one skill.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {/* Main Content */}
      <Card className="lg:col-span-2 w-full">
        {/* Basic Information */}
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="fromWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">Select Wallet</FormLabel>
                  <FormControl>
                    <WalletSelector
                      wallets={wallets}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('fromWallet') && wallets && (
              <WalletInfoDisplay
                wallet={wallets.find(w => w.address === form.watch('fromWallet'))}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium text-gray-300">
                    {agentType === AgentType.AI_AGENT ? 'Agent Name' : 'Name'}
                  </FormLabel>
                  <FormControl className="w-full">
                    <Input
                      className="w-full"
                      placeholder={
                        agentType === AgentType.AI_AGENT
                          ? 'e.g., AI-ContentOptimizer'
                          : 'e.g., AI-LifestyleGuru'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Profile Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={
                        agentType === AgentType.AI_AGENT
                          ? "Describe the AI agent's expertise and capabilities..."
                          : "Describe the AI influencer's content style and audience..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium text-gray-300">Social URL</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full"
                      type="url"
                      placeholder="https://www.instagram.com/yourusername"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Single Topic Selection */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">Topic</FormLabel>
                  <Select
                    onValueChange={value => handleTopicChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topics.map(topic => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>

        {/* Skills & Pricing */}
        <CardContent>
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-4 lg:mb-6 flex items-center">
            <span className="mr-2">
              {agentType === AgentType.AI_AGENT ? 'Skills & Pricing' : 'Social Media Capabilities'}
            </span>
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-act-2-purple bg-opacity-20 text-act-2-purple-light">
              {form.watch('skills')?.filter(t => t.enabled).length || 0} Active
            </span>
          </h2>

          <div className="space-y-6">
            {/* Skills List */}
            <div className="grid grid-cols-1 gap-6">
              {form.watch('skills')?.map((skill, index) => (
                <CardInner
                  key={index}
                  className={`relative border transition-all duration-300 overflow-hidden ${
                    skill.enabled
                      ? ' border-act-2-purple shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                      : ''
                  }`}
                >
                  {/* Header section with toggle and skill name */}
                  <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <FormLabel className="text-sm font-medium text-gray-300">
                          Skill Name
                        </FormLabel>
                        <div className="font-medium text-white">{skill.skillName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors ml-4 p-2 rounded-full hover:bg-red-500/10"
                        aria-label="Remove skill"
                      >
                        <Trash size={18} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <FormField
                        control={form.control}
                        name={`skills.${index}.enabled`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={value => {
                                  field.onChange(value);
                                  toggleSkill(index, value);
                                }}
                                className="data-[state=checked]:bg-act-2-purple"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium text-gray-300 m-0">
                              Active
                            </FormLabel>
                            <p className="text-xs text-gray-400 ml-1">
                              Enable this skill to make it available
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div
                    className={`
                      grid transition-all duration-500 ease-in-out
                      ${skill.enabled ? 'grid-template-rows-1fr' : 'grid-template-rows-0fr'}
                    `}
                    style={{
                      gridTemplateRows: skill.enabled ? '1fr' : '0fr',
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="p-4 pt-0 border-t border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.fee`}
                            render={({ field }) => (
                              <FormItem className="mt-2">
                                <FormLabel className="text-sm font-medium text-gray-300">
                                  Fee
                                </FormLabel>
                                <div className="relative">
                                  <span className="absolute z-10 left-3 top-1/2 transform -translate-y-1/2 text-act-2-purple font-medium">
                                    IP
                                  </span>
                                  <FormControl>
                                    <Input
                                      className="pl-10"
                                      placeholder="e.g., 50.00"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...field}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`skills.${index}.executionDuration`}
                            render={({ field }) => (
                              <FormItem className="mt-2">
                                <FormLabel className="text-sm font-medium text-gray-300">
                                  Execution Duration (seconds)
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 60" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.autoAssign`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-act-2-purple"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium text-gray-300 m-0">
                                  Auto Assign
                                </FormLabel>
                                <p className="text-xs text-gray-400 ml-2">
                                  Enable to automatically assign this skill to new tasks
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardInner>
              ))}
            </div>

            {availableSkills.length > 0 &&
              form.watch('skills')?.length < availableSkills.length && (
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  className="w-full items-center justify-center"
                  onClick={() => {
                    const currentSkills = form.getValues('skills') || [];
                    const existingSkillNames = currentSkills.map(skill => skill.skillName);

                    // Find skills that haven't been added yet
                    const availableToAdd = availableSkills.filter(
                      skill => !existingSkillNames.includes(skill),
                    );

                    if (availableToAdd.length > 0) {
                      form.setValue('skills', [
                        ...currentSkills,
                        {
                          skillName: availableToAdd[0],
                          enabled: true,
                          fee: '10.00', // Changed to support decimals
                          executionDuration: '3600',
                          autoAssign: false,
                        },
                      ]);
                    }
                  }}
                >
                  <Plus size={18} className="mr-2" /> Add Available Skill
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Right Side */}
      <div className="space-y-6 col-span-3 lg:col-span-1">
        {/* Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-1"
                    >
                      <CardInner className="w-full flex items-center">
                        <FormItem className="flex w-full items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" id="public" />
                          </FormControl>
                          <FormLabel className="font-normal text-white" htmlFor="public">
                            <div>
                              <span className="text-white">Public Profile</span>
                              <p className="text-sm text-gray-400 mt-1">Visible to all users</p>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </CardInner>

                      <CardInner className="w-full flex items-center">
                        <FormItem className="flex w-full items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="private" id="private" />
                          </FormControl>
                          <FormLabel className="font-normal text-white" htmlFor="private">
                            <div>
                              <span className="text-white">Private Profile</span>
                              <p className="text-sm text-gray-400 mt-1">Invitation only</p>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </CardInner>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

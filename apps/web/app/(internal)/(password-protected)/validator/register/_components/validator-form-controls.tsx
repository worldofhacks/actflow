'use client';
import { ValidatorFormValues } from '@/app/(internal)/(password-protected)/validator/register/_components/validator-form-wrapper';
import { MultiSelect } from '@/components/multi-select';
import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { WalletInfoDisplay, WalletSelector } from '@/components/ui/wallet-selector';
import { Wallet } from '@/types/user/wallet';
import { useFormContext } from 'react-hook-form';

interface ValidatorFormControlsProps {
  wallets?: Wallet[];
  topics: string[];
}

export const ValidatorFormControls = ({ wallets, topics }: ValidatorFormControlsProps) => {
  const form = useFormContext<ValidatorFormValues>();

  return (
    <>
      {/* Main Content */}
      <Card className="lg:col-span-2 w-full overflow-visible">
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
                    Validator Name
                  </FormLabel>
                  <FormControl className="w-full">
                    <Input className="w-full" placeholder="e.g., ContentValidatorPro" {...field} />
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
                      placeholder="Describe your expertise and validation experience..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimumFee"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Minimum Fee (IP)
                  </FormLabel>
                  <div className="relative">
                    <span className="absolute z-10 left-3 top-1/2 transform -translate-y-1/2 text-act-2-purple font-medium">
                      IP
                    </span>
                    <FormControl>
                      <Input
                        className="pl-10"
                        placeholder="e.g., 10.00"
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

            {/* Topics Selection - Using MultiSelect */}
            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">
                    Select Topics
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={topics.map(topic => ({ label: topic, value: topic }))}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select topics"
                      // variant="inverted"
                      animation={2}
                      maxCount={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

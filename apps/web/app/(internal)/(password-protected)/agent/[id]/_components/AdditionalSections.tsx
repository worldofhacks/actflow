import { BarChart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardInner,
  CardTitle,
} from '../../../../../../components/ui/card';
import { AgentDetails } from '../../../../../../types/agent/agent';

interface AdditionalSectionsProps {
  agent: AgentDetails;
}

export const CommentAnalysisSection = ({}: AdditionalSectionsProps) => {
  return (
    <Card className="mb-6" id="comments">
      <CardHeader>
        <CardTitle>Comment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <CardInner>
          <p className="text-gray-400">Sentiment analysis data not available</p>
        </CardInner>
      </CardContent>
    </Card>
  );
};

export const AIInsightsSection = ({}: AdditionalSectionsProps) => {
  return (
    <Card className="mb-6" id="insights">
      <CardHeader>
        <CardTitle>AI-Powered Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-2 bg-white bg-opacity-[0.03] rounded-lg">
              <BarChart className="h-6 w-6 text-act-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Performance & Recommendations</h3>
              <p className="text-sm text-gray-400 mt-1">AI Analysis & Optimization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="bg-white bg-opacity-[0.03] rounded-lg p-5 h-full">
                <h3 className="text-white font-medium mb-4">Engagement Forecast</h3>
                <div className="h-28 bg-white bg-opacity-[0.05] rounded-lg"></div>
                <p className="text-act-turquoise mt-4">Predicted Rate: 175%</p>
              </div>
            </div>

            <div className="col-span-2">
              <div className="bg-white bg-opacity-[0.03] rounded-lg p-5 h-full">
                <h3 className="text-white font-medium mb-4">Optimization Tips</h3>
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-[0.05] rounded-lg p-4">
                    <p className="text-white">Best Posting Time</p>
                    <p className="text-sm text-gray-400 mt-1">
                      3-4 PM on weekdays maximizes engagement
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-[0.05] rounded-lg p-4">
                    <p className="text-white">Hashtag Strategy</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Using 3+ hashtags boosts visibility by 22%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const GrowthSection = ({}: AdditionalSectionsProps) => {
  return (
    <Card className="mb-6" id="growth">
      <CardHeader>
        <CardTitle>Growth & Interests</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardInner>
            <h3 className="text-lg font-semibold text-white mb-4">Interest Categories</h3>
            <div className="space-y-4">
              <div className="bg-white bg-opacity-[0.03] rounded-lg p-6 flex items-center justify-center">
                <p className="text-gray-400">Interest data not available</p>
              </div>
            </div>
          </CardInner>

          <CardInner>
            <h3 className="text-lg font-semibold text-white mb-4">Growth Trends</h3>
            <div className="space-y-4">
              <div className="bg-white bg-opacity-[0.03] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Monthly Growth</span>
                  <span className="text-act-gold">+2.3%</span>
                </div>
                <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                  <div className="bg-act-gold h-2 rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
            </div>
          </CardInner>
        </div>
      </CardContent>
    </Card>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AudienceSection = ({ agent }: AdditionalSectionsProps) => {
  // Agent data will be used for demographic information once available
  return (
    <Card className="mb-6" id="audience">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Audience Demographics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardInner className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-2 bg-white bg-opacity-[0.03] rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-act-2-purple"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-geist font-medium text-[15px] leading-none tracking-[-0.01em] text-white">
                  Age Distribution
                </h3>
                <p className="font-geistMono font-normal text-[13px] leading-none tracking-[0] text-gray-400 mt-2">
                  Primary audience age groups
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-geistMono text-[13px] text-gray-400">18-24</span>
                  <span className="font-geist text-[15px] text-act-2-purple-light">32%</span>
                </div>
                <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                  <div className="bg-act-2-purple h-2 rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-geistMono text-[13px] text-gray-400">25-34</span>
                  <span className="font-geist text-[15px] text-act-2-purple-light">45%</span>
                </div>
                <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                  <div className="bg-act-2-purple h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-geistMono text-[13px] text-gray-400">35-44</span>
                  <span className="font-geist text-[15px] text-act-2-purple-light">15%</span>
                </div>
                <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                  <div className="bg-act-2-purple h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-geistMono text-[13px] text-gray-400">45+</span>
                  <span className="font-geist text-[15px] text-act-2-purple-light">8%</span>
                </div>
                <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                  <div className="bg-act-2-purple h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>
          </CardInner>

          <CardInner className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-2 bg-white bg-opacity-[0.03] rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-act-gold"
                >
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"></path>
                  <path d="M3 12h18"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-geist font-medium text-[15px] leading-none tracking-[-0.01em] text-white">
                  Geographic Distribution
                </h3>
                <p className="font-geistMono font-normal text-[13px] leading-none tracking-[0] text-gray-400 mt-2">
                  Top regions by engagement
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-act-2-purple-light flex items-center justify-center">
                      <span className="font-geistMono text-[11px] text-white">US</span>
                    </div>
                    <span className="font-geistMono text-[13px] text-white">United States</span>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">42%</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-act-2-purple-light flex items-center justify-center">
                      <span className="font-geistMono text-[11px] text-white">UK</span>
                    </div>
                    <span className="font-geistMono text-[13px] text-white">United Kingdom</span>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">18%</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-act-2-purple-light flex items-center justify-center">
                      <span className="font-geistMono text-[11px] text-white">CA</span>
                    </div>
                    <span className="font-geistMono text-[13px] text-white">Canada</span>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">14%</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-act-2-purple-light flex items-center justify-center">
                      <span className="font-geistMono text-[11px] text-white">AU</span>
                    </div>
                    <span className="font-geistMono text-[13px] text-white">Australia</span>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">10%</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-act-2-purple-light flex items-center justify-center">
                      <span className="font-geistMono text-[11px] text-white">OT</span>
                    </div>
                    <span className="font-geistMono text-[13px] text-white">Other</span>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">16%</span>
                </div>
              </div>
            </div>
          </CardInner>

          <CardInner className="p-6 md:col-span-2">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-2 bg-white bg-opacity-[0.03] rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-act-turquoise"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-4-4h-4"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <circle cx="19" cy="11" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3 className="font-geist font-medium text-[15px] leading-none tracking-[-0.01em] text-white">
                  Gender & Interest Breakdown
                </h3>
                <p className="font-geistMono font-normal text-[13px] leading-none tracking-[0] text-gray-400 mt-2">
                  Audience composition by engagement
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <h4 className="font-geist font-medium text-[15px] leading-none tracking-[-0.01em] text-white mb-4">
                  Gender Distribution
                </h4>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-geistMono text-[13px] text-gray-400">Male</span>
                    <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                      <div
                        className="bg-act-2-purple h-2 rounded-full"
                        style={{ width: '62%' }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">62%</span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-geistMono text-[13px] text-gray-400">Female</span>
                    <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                      <div className="bg-[#facb7b] h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">35%</span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-geistMono text-[13px] text-gray-400">Other</span>
                    <div className="w-full bg-white bg-opacity-[0.03] rounded-full h-2">
                      <div className="bg-[#9397fb] h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                  </div>
                  <span className="font-geist text-[15px] text-act-2-purple-light">3%</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-[0.03] rounded-2xl p-4">
                <h4 className="font-geist font-medium text-[15px] leading-none tracking-[-0.01em] text-white mb-4">
                  Top Interests
                </h4>

                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Technology (68%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      AI (54%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Web3 (42%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Finance (37%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Gaming (31%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Marketing (28%)
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white bg-opacity-[0.03] rounded-full">
                    <span className="font-geistMono text-[13px] text-act-2-purple-light">
                      Design (25%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardInner>
        </div>
      </CardContent>
    </Card>
  );
};

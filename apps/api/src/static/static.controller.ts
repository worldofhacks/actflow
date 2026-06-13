import { Controller, Get, Logger, Query } from '@nestjs/common';

@Controller('static')
export class StaticDataController {
  private readonly logger = new Logger(StaticDataController.name);

  private readonly topicToSkillsDict: Record<string, string[]> = {
    x: [
      'tweet',
      'news',
      'news_img',
      'news_video',
      'thread',
      'thread_img',
      'thread_video',
      'img',
      'video',
      'mix_img',
    ],
    img: ['img', 'ideogram', 'dalle', 'mix'],
    video: ['video'],
    blog: ['basic', 'news', 'bitcino'],
  };

  @Get('topics')
  async getTopics() {
    return Object.keys(this.topicToSkillsDict);
  }

  @Get('skills')
  async getSkillsByTopic(@Query('topic') topic: string) {
    return this.topicToSkillsDict[topic];
  }
}

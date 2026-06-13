import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IEventHandler } from '../../types/IEventHandler';

@Injectable()
export class EventHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(EventHandlerRegistry.name);
  private readonly handlers = new Map<string, IEventHandler>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.logger.log('Event handler registry initialized');
  }

  registerHandler(handler: IEventHandler): void {
    this.handlers.set(handler.eventName, handler);
    this.logger.verbose(`Registered handler for event: ${handler.eventName}`);
  }

  registerHandlers(handlers: IEventHandler[]): void {
    handlers.forEach(handler => this.registerHandler(handler));
    this.logger.verbose(`Registered ${handlers.length} handlers`);
  }

  getHandler(eventName: string): IEventHandler | undefined {
    return this.handlers.get(eventName);
  }

  hasHandler(eventName: string): boolean {
    return this.handlers.has(eventName);
  }

  getSupportedEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

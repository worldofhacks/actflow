# Messaging Module

## Overview

The Messaging Module is a comprehensive system for handling blockchain events in the ACT-1 platform. It processes events from the blockchain, applies business logic, and updates the application state accordingly. This module uses the Event Sourcing pattern, where all state changes are driven by events.

## Key Features

- Blockchain event listening and processing
- Event dependency management
- Automated retries for failed events
- State machine enforcement for agents and tasks
- Historical event syncing

## Architecture

### Directory Structure

```
messaging/
├── handlers/             # Event handlers for specific event types
│   ├── agent/            # Agent-related handlers
│   ├── admin/            # Administrative handlers
│   ├── task/             # Task-related handlers
│   └── base/             # Base handler class
├── interfaces/           # Interfaces used throughout the module
├── schema/               # Database schemas
├── services/             # Core services
│   ├── blockchain/       # Blockchain interaction services
│   ├── processing/       # Event processing services
│   ├── state-machine/    # State transition services
│   └── messaging/        # Message queue services
├── types/                # Type definitions
├── utils/                # Utility functions
├── scripts/              # Maintenance scripts
├── messaging.module.ts   # Module definition
└── README.md             # This file
```

### Key Components

#### Services

- **BlockchainEventService**: Manages blockchain events in the database
- **BlockTrackerService**: Tracks which blockchain blocks have been processed
- **MarketEventService**: Listens for events from the blockchain
- **EventProcessorService**: Main service for processing events
- **EventDependencyService**: Manages dependencies between events
- **WaitingEventService**: Handles events waiting for dependencies
- **EventHandlerRegistry**: Registry of event handlers
- **EventHandlerProvider**: Provides and registers event handlers
- **StateMachines**: Enforce valid state transitions for agents and tasks

#### Event Handlers

Event handlers follow a consistent pattern:

1. Extract relevant data from the event
2. Validate state transitions (when applicable)
3. Update the application state

Each handler extends the `BaseEventHandler` class and implements specific logic for its event type.

## Event Flow

1. **Event Detection**: `MarketEventService` detects events from the blockchain
2. **Event Storage**: Events are stored in the database via `BlockchainEventService`
3. **Event Processing**: `EventProcessorService` processes unprocessed events
4. **Dependency Check**: `EventDependencyService` checks if event dependencies are met
5. **Handler Execution**: The appropriate event handler processes the event
6. **State Update**: The application state is updated based on the event

## Usage

The module is designed to be used as part of the NestJS application. Import it into your application:

```typescript
import { Module } from '@nestjs/common';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    MessagingModule,
    // Other modules
  ],
})
export class AppModule {}
```

## Event Handling

To create a new event handler:

1. Create a new handler class extending `BaseEventHandler`
2. Implement the required methods: `createEntityUpdate` and `updateEntityState`
3. Register the handler in `messaging.module.ts` and `event-handler.provider.ts`

Example:

```typescript
export class NewEventHandler extends BaseEventHandler {
  constructor(
    @Inject(SomeService) private readonly someService: SomeService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('NewEvent', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      // Extract relevant data from event
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    // Apply business logic to update state
  }
}
```

## Event Dependencies

Events often need to be processed in a specific order. For example, you can't process a `TaskAssigned` event until the `CreateTask` event has been processed. The `EventDependencyService` manages these dependencies.

To add a new dependency:

1. Update the `initializeDependencies` method in `event-dependency.service.ts`
2. The system will automatically handle waiting and retrying

## Historical Processing

When the system starts or reconnects to the blockchain, it may need to process missed events. The `MarketEventService` handles historical syncing by:

1. Determining the last processed block
2. Fetching all events from that block to the current block
3. Processing those events in order

## Error Handling & Retries

The system includes robust error handling:

1. Failed events are marked with an error status
2. A scheduled task periodically resets failed events for retry
3. Events with unmet dependencies are placed in a waiting state
4. Waiting events are periodically checked to see if dependencies are now met

## Maintenance Scripts

The module includes maintenance scripts for operations like:

- Clearing message queues
- Resetting event processing status
- Testing event processing

These scripts are in the `scripts` directory.

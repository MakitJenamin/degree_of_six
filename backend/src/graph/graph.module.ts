import { Module } from '@nestjs/common';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';
import { GraphGateway } from './graph.gateway';

@Module({
  providers: [GraphService, GraphGateway],
  controllers: [GraphController],
})
export class GraphModule {}

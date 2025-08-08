// src/app.module.ts
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostGroup } from './entities/post-group.entity';
import { Post } from './entities/post.entity';
import { PostGroupResolver } from './resolvers/post-group.resolver';
import { PostGroupService } from './services/post-group.service';
import { SeedService } from './database/seed.service';
import { DateTimeScalar } from './scalars/date-time.scalar';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'maggie_db',
      entities: [PostGroup, Post],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [process.cwd() + '/src/**/*.graphql'],
      playground: true,
      introspection: true,
      debug: true, // <-- Enable debugging for better error visibility
      definitions: {
        path: process.cwd() + '/src/graphql/graphql.types.ts',
        outputAs: 'interface',
      },
    }),
    TypeOrmModule.forFeature([PostGroup, Post]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PostGroupResolver,
    PostGroupService,
    SeedService,
    DateTimeScalar,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}

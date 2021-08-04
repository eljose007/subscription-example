import { PubSub } from "graphql-subscriptions";

export interface MyContext {
  messages: [String];
  pubSub: PubSub;
}

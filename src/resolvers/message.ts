import { PubSub as PubSubEngine } from "graphql-subscriptions";
import {
  Arg,
  Ctx,
  Mutation,
  ObjectType,
  PubSub,
  Query,
  Root,
  Subscription,
} from "type-graphql";
import { MyContext } from "../context";

@ObjectType()
export class MessageResolver {
  @Query(() => [String])
  messages(@Ctx() { messages }: MyContext) {
    return messages;
  }
  @Mutation(() => Boolean)
  postMessage(
    @Arg("message") message: string,
    @Ctx() { messages }: MyContext,
    @PubSub() pubSub: PubSubEngine
  ) {
    messages.push(message);
    pubSub.publish("NEW_MESSAGE", { messageSubscription: message });
    return true;
  }
  @Subscription(() => String, {
    topics: "NEW_MESSAGE",
  })
  messageSubscription(@Root() { messageSubscription }: any) {
    return messageSubscription;
  }
}

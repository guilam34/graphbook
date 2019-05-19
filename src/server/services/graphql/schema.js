const typeDefinitions = `
  directive @auth on QUERY | FIELD_DEFINITION | FIELD
  scalar Upload

  type File {
    filename: String!
    url: String!
  }

  type Auth {
     token: String
  }
  type UsersSearch {
     users: [User]
  }
  type Response {
    success: Boolean
 }
 type User {
     id: Int
     avatar: String
     username: String
   }
   type Post {
     id: Int
      text: String
      user: User 
    }
   type Message {
     id: Int
     text: String
     chat: Chat
     user: User
  }
   type Chat {
     id: Int
     messages: [Message]
     users: [User]
     lastMessage: Message
   }
   type PostFeed {
              posts: [Post]
}
 type RootQuery {
   posts: [Post]
     chats: [Chat] @auth
     chat(chatId: Int): Chat
     postsFeed(page: Int, limit: Int): PostFeed @auth
     usersSearch(page: Int, limit: Int, text: String!): UsersSearch
     currentUser: User @auth
 }
 input PostInput {
   text: String!
 }
 input UserInput {
   username: String!
   avatar: String!
 }
 input ChatInput {
    users: [Int]
 }
 input MessageInput {
   text: String!
  chatId: Int!
 }
 type RootMutation {
   addPost (
     post: PostInput!
   ): Post
   addChat (
     chat: ChatInput!
  ): Chat
  addMessage (
    message: MessageInput!
  ): Message
  updatePost (
      post: PostInput!
      postId: Int!
  ): Post
  deletePost (
    postId: Int!
  ): Response
  login (
     email: String!
     password: String!
  ): Auth
  signup (
     username: String!
     email: String!
     password: String!
  ): Auth
  uploadAvatar (
     file: Upload!
  ): File @auth
 }
 schema {
   query: RootQuery
   mutation: RootMutation
 } 
`;
export default [typeDefinitions];


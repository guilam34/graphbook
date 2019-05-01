import logger from "../../helpers/logger";

const resolvers = {
	RootQuery: {
		posts(root, args, context) {
			return posts;
		}
	},
	RootMutation: {
		addPost(root, { post, user }, context) {
			const postObject = {
				...post,
				user,
				id: posts.length + 1
			};
			posts.push(postObject);
			logger.log({ level: "info", message: "Post was created" });
			return postObject;
		}
	}
};
export default function resolver() {
	// 'this' refers to DAO passed in via Resolvers.call
	const { db } = this;
	const { Post, User, Chat, Message } = db.models;
	const resolvers = {
		RootQuery: {
			posts(root, args, context) {
				return Post.findAll({ order: [["createdAt", "DESC"]] });
			},
			chats(root, args, context) {
				return User.findAll().then(users => {
					if (!users.length) {
						return [];
					}
					const usersRow = users[0];

					// return info on the entire items even if the findAll params filter specific values (e.g. userId = 3)
					return Chat.findAll({
						include: [
							{
								model: User,
								required: true,
								// filter for Chats were the given user is part of and ONLY those chats
								through: { where: { userId: usersRow.id } }
							},
							{
								// no required -> more or less does LEFT OUTER JOIN
								// call Model resolvers
								model: Message
							}
						]
					});
				});
			}
		},
		RootMutation: {
			addPost(root, { post }, context) {
				logger.log({
					level: "info",
					message: "Post was created"
				});
				return User.findAll().then(users => {
					const usersRow = users[0];
					return Post.create({
						...post
					}).then(newPost => {
						return Promise.all([newPost.setUser(usersRow.id)]).then(() => {
							return newPost;
						});
					});
				});
			},
			addChat(root, { chat }, context) {
				logger.log({
					level: "info",
					message: "Message was created"
				});
				return Chat.create().then(newChat => {
					return Promise.all([newChat.setUsers(chat.users)]).then(() => {
						return newChat;
					});
				});
			},
			addMessage(root, { message }, context) {
				logger.log({
					level: "info",
					message: "Message was created"
				});
				return User.findAll().then(users => {
					const usersRow = users[0];
					return Message.create({
						...message
					}).then(newMessage => {
						return Promise.all([
							newMessage.setUser(usersRow.id),
							newMessage.setChat(message.chatId)
						]).then(() => {
							return newMessage;
						});
					});
				});
			}
		},

		Post: {
			// rest of Post information is already available in Post so we don't need resolvers for the other fields
			user(post, args, context) {
				return post.getUser();
			}
		},
		Message: {
			user(message, args, context) {
				return message.getUser();
			},
			chat(message, args, context) {
				return message.getChat();
			}
		},
		Chat: {
			messages(chat, args, context) {
				return chat.getMessages({ order: [["id", "ASC"]] });
			},
			users(chat, args, context) {
				return chat.getUsers();
			}
		}
	};

	return resolvers;
}

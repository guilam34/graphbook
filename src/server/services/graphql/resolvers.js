import logger from "../../helpers/logger";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import Sequelize from "sequelize";
const Op = Sequelize.Op;

// saving secret in file, yes very safe
// export JWT_SECRET=awv4BcIzsRysXkhoSAb8t8lNENgXSqBruVlLwd45kGdYjeJHLap9LUJ1t9DTdw36DvLcWs3qEkPyCY6vOyNljlh2Er952h2gDzYwG82rs1qfTzdVIg89KTaQ4SWI1YGY

const JWT_SECRET =
	"awv4BcIzsRysXkhoSAb8t8lNENgXSqBruVlLwd45kGdYjeJHLap9LUJ1t9DTdw36DvLcWs3qEkPyCY6vOyNljlh2Er952h2gDzYwG82rs1qfTzdVIg89KTaQ4SWI1YGY";

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
			},
			chat(root, { chatId }, context) {
				return Chat.findByPk(chatId, {
					include: [
						{
							model: User,
							required: true
						},
						{
							model: Message
						}
					]
				});
			},
			postsFeed(root, { page, limit }, context) {
				var skip = 0;
				if (page && limit) {
					skip = page * limit;
				}
				var query = {
					order: [["createdAt", "DESC"]],
					offset: skip
				};
				if (limit) {
					query.limit = limit;
				}
				return {
					posts: Post.findAll(query)
				};
			},
			usersSearch(root, { page, limit, text }, context) {
				if (text.length < 3) {
					return {
						users: []
					};
				}
				var skip = 0;
				if (page && limit) {
					skip = page * limit;
				}
				var query = {
					order: [["createdAt", "DESC"]],
					offset: skip
				};
				if (limit) {
					query.limit = limit;
				}
				query.where = {
					username: {
						[Op.like]: "%" + text + "%"
					}
				};
				return {
					users: User.findAll(query)
				};
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
			},
			updatePost(root, { post, postId }, context) {
				return Post.update(
					{
						...post
					},
					{
						where: {
							id: postId
						}
					}
				).then(rows => {
					if (rows[0] === 1) {
						logger.log({
							level: "info",
							message: "Post " + postId + " was updated"
						});
						return Post.findByPk(postId);
					}
				});
			},
			deletePost(root, { postId }, context) {
				return Post.destroy({
					where: {
						id: postId
					}
				}).then(
					function(rows) {
						if (rows === 1) {
							logger.log({
								level: "info",
								message: "Post " + postId + "was deleted"
							});
							return {
								success: true
							};
						}
						return {
							success: false
						};
					},
					function(err) {
						logger.log({
							level: "error",
							message: err.message
						});
					}
				);
			},
			login(root, { email, password }, context) {
				return User.findAll({
					where: {
						email
					},
					raw: true
				}).then(async users => {
					if ((users.length = 1)) {
						const user = users[0];
						const passwordValid = await bcrypt.compare(password, user.password);
						if (!passwordValid) {
							throw new Error("Password does not match");
						}
						const token = JWT.sign({ email, id: user.id }, JWT_SECRET, {
							expiresIn: "1d"
						});
						return {
							token
						};
					} else {
						throw new Error("User not found");
					}
				});
			},
			signup(root, { email, password, username }, context) {
				return User.findAll({
					where: {
						[Op.or]: [{ email }, { username }]
					},
					raw: true
				}).then(async users => {
					if (users.length) {
						throw new Error("User already exists");
					} else {
						return bcrypt.hash(password, 10).then(hash => {
							return User.create({
								email,
								password: hash,
								username,
								activated: 1
							}).then(newUser => {
								const token = JWT.sign({ email, id: newUser.id }, JWT_SECRET, {
									expiresIn: "1d"
								});
								return {
									token
								};
							});
						});
					}
				});
			}
		},

		Post: {
			// rest of Post information is already available in Post with ORM magic in models/post.js so we don't need resolvers for the other fields
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
			},
			lastMessage(chat, args, context) {
				return chat
					.getMessages({ limit: 1, order: [["id", "DESC"]] })
					.then(message => {
						return message[0];
					});
			}
		}
	};

	return resolvers;
}

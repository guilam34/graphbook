import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

const GET_POSTS = gql`
	query postsFeed($page: Int, $limit: Int) {
		postsFeed(page: $page, limit: $limit) {
			posts {
				id
				text
				user {
					avatar
					username
				}
			}
		}
	}
`;

const UPDATE_POST = gql`
	mutation updatePost($post: PostInput!, $postId: Int!) {
		updatePost(post: $post, postId: $postId) {
			id
			text
		}
	}
`;

export default class UpdatePostMutation extends Component {
	state = {
		postContent: this.props.post.text
	};
	changePostContent = value => {
		this.setState({ postContent: value });
	};
	render() {
		const self = this;
		const { children } = this.props;
		const { postContent } = this.state;
		const postId = this.props.post.id;
		const variables = { page: 0, limit: 10 };
		return (
			<Mutation
				update={(store, { data: { updatePost } }) => {
					var query = {
						query: GET_POSTS
					};
					if (typeof variables !== typeof undefined) {
						query.variables = variables;
					}
					// This is writing to the Apollo store so that when it tries to fetch more for a query, the "previous results" will contain the new post
					const data = store.readQuery(query);
					for (var i = 0; i < data.postsFeed.posts.length; i++) {
						if (data.postsFeed.posts[i].id === postId) {
							data.postsFeed.posts[i].text = updatePost.text;
							break;
						}
					}
					store.writeQuery({ ...query, data });
				}}
				optimisticResponse={{
					__typename: "mutation",
					updatePost: {
						__typename: "Post",
						text: postContent
					}
				}}
				mutation={UPDATE_POST}
			>
				{updatePost =>
					React.Children.map(children, function(child) {
						// ES6 map declaration
						return React.cloneElement(child, {
							updatePost,
							postContent,
							postId,
							changePostContent: self.changePostContent
						});
					})
				}
			</Mutation>
		);
	}
}
